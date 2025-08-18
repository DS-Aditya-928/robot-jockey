import os
from mutagen.easyid3 import EasyID3
from onnxruntime import InferenceSession
from librosa.feature import melspectrogram
from librosa import db_to_amplitude
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
file_path = BASE_DIR / "ONNX_DEAM.onnx"

def analyse(earlyKill, dir):
    print("T")
    ort_session = InferenceSession(
    file_path, providers=["CPUExecutionProvider"]
    )
    for dirpath, dirnames, filenames in os.walk(dir):
        if(type(filenames) == list):
            for i in filenames:
                try:
                    x = EasyID3(os.path.join(dirpath, i))
                    if(x is not None):
                        print(x.keys())
                except Exception:
                    pass
                
                        