# Stem Separation App (Concatenation Station)

A full-stack web application to separate audio stems from music files.

## Architecture
- **Frontend**: Next.js (Port 3000) - UI for uploading and playback.
- **Backend**: Node.js/Express (Port 3001) - API Gateway, File Management.
- **Microservice**: Python/FastAPI (Port 8000) - Audio Processing (Spleeter).

## 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.8+)
- **FFmpeg** (Required by Spleeter)
  - Mac: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`
  - Windows: Download binaries.

## 2. Setup & Installation

### Python Worker (Microservice)
```bash
cd worker
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Note: Spleeter downloads models on first run (can take time)
```

### Node.js Backend (Server)
```bash
cd server
npm install
```

### Frontend (Client)
```bash
cd client
npm install
```

## 3. Running the App

You need to run all three services simultaneously. Open 3 terminal tabs:

**Tab 1: Worker**
```bash
cd worker
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Tab 2: Server**
```bash
cd server
npm start
# Runs on http://localhost:3001
```

**Tab 3: Client**
```bash
cd client
npm run dev
# Runs on http://localhost:3000
```

## 4. Usage
1. Open [http://localhost:3000](http://localhost:3000).
2. Upload an MP3 or WAV file.
3. Wait for processing (can take 30s - 2min depending on file size and CPU).
4. Listen to or download the individual stems (Vocals, Accompaniment).

## Scaling Tips
- **Storage**: Move from local filesystem (`uploads/`) to Cloud Storage (AWS S3) using `boto3` in Python and `aws-sdk` in Node.
- **Queueing**: Use Redis/Celery instead of direct HTTP calls to the worker to handle backpressure and long-running jobs asynchronously.
- **GPU**: Run the Python worker on a machine with a GPU (NVIDIA) for 100x faster separation.
# StemSplit
