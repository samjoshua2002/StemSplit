
import torch
import torchaudio
import os

print("Torchaudio version:", torchaudio.__version__)

try:
    import soundfile
    print("Soundfile version:", soundfile.__version__)
except ImportError:
    print("Soundfile NOT INSTALLED")

# Check backends (API varies by version)
try:
    print("Available backends:", torchaudio.list_audio_backends())
except:
    pass

# Try generating and saving a dummy signal
try:
    waveform = torch.zeros(2, 44100) # Stereo 1 sec silence
    path = "test_output.wav"
    print(f"Attempting to save {path} using backend...")
    torchaudio.save(path, waveform, 44100, backend="soundfile") 
    print("Save Success!")
    if os.path.exists(path):
        os.remove(path)
except Exception as e:
    print(f"Save Failed: {e}")
