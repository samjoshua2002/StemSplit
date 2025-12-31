
import sys
print("Testing imports...")
try:
    import tqdm
    print("tqdm: OK")
except ImportError as e:
    print(f"tqdm: FAIL {e}")

try:
    import openunmix
    print("openunmix: OK")
except ImportError as e:
    print(f"openunmix: FAIL {e}")

try:
    import demucs.separate
    print("demucs.separate: OK")
except ImportError as e:
    print(f"demucs.separate: FAIL {e}")

try:
    import lameenc
    print("lameenc: OK (Found)")
except ImportError:
    print("lameenc: NOT FOUND (Expected, checking if Demucs crashes without it)")
