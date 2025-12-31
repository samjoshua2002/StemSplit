from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import subprocess
import os
from pathlib import Path

app = FastAPI()

# Directories
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
PROCESSED_DIR = Path(__file__).parent.parent / "processed"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


class SeparationRequest(BaseModel):
    filename: str
    stems: int = 2


@app.get("/")
async def health_check():
    return {"status": "ok", "service": "python-audio-worker"}


@app.post("/separate")
async def separate_audio(request: SeparationRequest):
    """
    Separate audio file into stems using Demucs.
    """
    input_path = UPLOAD_DIR / request.filename
    
    if not input_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {request.filename}")
    
    try:
        # Run demucs via subprocess
        # -n htdemucs: use the htdemucs model (6 stems: drums, bass, vocals, other, guitar, piano)
        # -o: output directory
        
        cmd = [
            "demucs",
            "-n", "htdemucs",
            "-o", str(PROCESSED_DIR),
            str(input_path)
        ]
        
        print(f"Running command: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        
        print(f"Demucs output: {result.stdout}")
        
        # Demucs outputs to: PROCESSED_DIR/htdemucs/<filename_without_ext>/
        filename_no_ext = input_path.stem
        output_folder = PROCESSED_DIR / "htdemucs" / filename_no_ext
        
        if not output_folder.exists():
            raise HTTPException(
                status_code=500, 
                detail=f"Output folder not created: {output_folder}"
            )
        
        # List all stem files
        stem_files = [f.name for f in output_folder.iterdir() if f.is_file()]
        
        return {
            "status": "success",
            "output_folder": str(output_folder),
            "stems": stem_files
        }
        
    except subprocess.CalledProcessError as e:
        print(f"Demucs error: {e.stderr}")
        raise HTTPException(
            status_code=500,
            detail=f"Audio separation failed: {e.stderr}"
        )
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )
