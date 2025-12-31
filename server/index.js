const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = 3001;
const WORKER_URL = 'http://localhost:8000';

// Configuration
const UPLOAD_DIR = path.resolve(__dirname, '../uploads');
const PROCESSED_DIR = path.resolve(__dirname, '../processed');

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());

// 1. Static file serving (for downloading stems)
// We serve the processed folder so frontend can directly link to files
app.use('/downloads', express.static(PROCESSED_DIR));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Keep original filename but ensure uniqueness if needed (skipping complexity for MVP)
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

    const filename = req.file.filename;
    console.log(`File uploaded: ${filename}`);

    try {
        // 3. Call Python Worker to start separation
        // Default to 2 stems (vocals, accompaniment)
        const response = await axios.post(`${WORKER_URL}/separate`, {
            filename: filename,
            stems: 2
        });

        const workerData = response.data;

        // Demucs (htdemucs) outputs to: PROCESSED_DIR/htdemucs/<filename_without_ext>/
        // calls return output_folder in workerData.output_folder, but let's be robust
        // The worker returns 'stems' list (filenames) and 'output_folder'

        // We need to serve the correct path. 
        // Our static serve is app.use('/downloads', express.static(PROCESSED_DIR));
        // So the URL should be /downloads/htdemucs/<filename_no_ext>/<stem>

        const folderName = path.parse(filename).name;
        // The worker uses 'htdemucs' model by default
        const modelName = 'htdemucs';

        const stems = workerData.stems.map(stemFile => ({
            name: stemFile,
            url: `http://localhost:${PORT}/downloads/${modelName}/${folderName}/${stemFile}`
        }));

        res.json({
            status: 'success',
            message: 'File processed successfully',
            originalFile: filename,
            stems: stems
        });

    } catch (error) {
        console.error('Worker error:', error.message);
        // If worker fails, we might want to return an error or status
        res.status(500).json({
            error: 'Processing failed',
            details: error.response ? error.response.data : error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
