const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Configuration
const UPLOAD_DIR = path.resolve(__dirname, '../uploads');
const PROCESSED_DIR = path.resolve(__dirname, '../processed');

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });

// Middleware
app.use(cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST']
}));
app.use(express.json());

// 1. Static file serving (for downloading stems)
// We serve the processed folder so frontend can directly link to files
app.use('/downloads', express.static(PROCESSED_DIR));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use normalized email or userId or 'guest'
        let subDir = 'guest';
        if (req.body.userEmail) {
            subDir = req.body.userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
        } else if (req.body.userId) {
            subDir = req.body.userId;
        }

        const userDir = path.join(UPLOAD_DIR, subDir);
        if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Routes

// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'node-api-gateway' });
});

// 2. Upload and Start Processing
app.post('/upload', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId, userEmail } = req.body;
    const filename = req.file.filename;

    // Normalize subfolder
    let subDir = 'guest';
    if (userEmail) {
        subDir = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
    } else if (userId) {
        subDir = userId;
    }

    console.log(`File uploaded: ${filename} for user: ${subDir}`);

    try {
        // 3. Call Python Worker to start separation
        // Note: The worker needs to know the correct base path if we change it.
        // Current logic assumes files are in UPLOAD_DIR.
        // We might need to pass the relative path from UPLOAD_DIR.
        const relativeFilePath = path.join(subDir, filename);

        const response = await axios.post(`${WORKER_URL}/separate`, {
            filename: relativeFilePath,
            stems: 2
        });

        const workerData = response.data;

        const folderName = path.parse(filename).name;
        const modelName = 'htdemucs';

        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        // Stems in workerData are filenames
        const stems = workerData.stems.map(stemFile => {
            // Path structure in processed: htdemucs/<subDir>/<filename_no_ext>/<stem>
            const relativePath = `${modelName}/${subDir}/${folderName}/${stemFile}`;

            return {
                name: stemFile,
                url: `${baseUrl}/downloads/${relativePath}`
            };
        });

        res.json({
            status: 'success',
            message: 'File processed successfully',
            originalFile: filename,
            stems: stems
        });

    } catch (error) {
        console.error('Worker error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Processing failed',
            details: error.response ? error.response.data : error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
