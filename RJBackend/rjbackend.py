import sys
import os
import time as t
import librosa
import numpy as np
from librosa.feature import melspectrogram
from librosa import power_to_db
from onnxruntime import InferenceSession
import soundfile as sf

def main():
    ort_session = InferenceSession(
    "C:\\NNModels\\ONNX_DEAM.onnx", providers=["CPUExecutionProvider"]
    )
    print("OK", flush=True)

    for line in sys.stdin:
        if line.startswith("S"):
            # start cmd rec
            t1 = t.time()
            mPath = line[len("S"):].strip()
            print(f"path: {mPath}", flush=True)

            samples, sr = sf.read(mPath, dtype='float32', always_2d=True)
            samples = samples[:, 0]  # Use only the first channel if stereo
            if sr != 44100:
                samples = librosa.resample(samples, orig_sr=sr, target_sr=44100)

            
            SAMPLE_LEN = 5
            NUM_SAMPLES = SAMPLE_LEN * 44100
            sampleStack = []

            for k in range(0, len(samples), NUM_SAMPLES):
                s = samples[k:k+NUM_SAMPLES]
                # print(len(s))
                if len(s) >= NUM_SAMPLES:
                    mel_spectrogram = librosa.feature.melspectrogram(
                        y=np.array(s),
                        sr=44100,
                        n_fft=2048,
                        hop_length=512,
                        n_mels=128,
                        power=2.0,  # matches torchaudio's power=2.0
                        htk=True,  # use librosa's mel filter bank
                        norm=None
                    )
                    mel_db = librosa.power_to_db(mel_spectrogram, top_db=80)
                    sampleStack += [np.expand_dims(mel_db, axis=0)]  # add mono channel
                del(s)

            print(len(sampleStack), flush=True)
            onnxruntime_outputs = ort_session.run(None, {'input':np.array(sampleStack)})[0]
            x = 0
            totalArousal = 0
            totalValence = 0
            for i in onnxruntime_outputs:
                #print(f"At {x}s: {i}")
                totalArousal += i[0]
                totalValence += i[1]
                x += 5
            t2 = t.time()
            print(f"Avg arousal: {totalArousal / (x / 5)}")
            print(f"Avg valence: {totalValence / (x / 5)}")
            print(f"Processing time: {t2 - t1} seconds")

            print("OK\r\n", flush=True)
        else:
            print("E0", flush=True)

if __name__ == "__main__":
    main()
