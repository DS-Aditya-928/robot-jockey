import sys
import os
import time as t
import librosa
import numpy as np
from librosa.feature import melspectrogram, rms
from librosa import power_to_db
from onnxruntime import InferenceSession
import soundfile as sf

def main():
    ort_session = InferenceSession(
    "C:\\NNModels\\ONNX_DEAM.onnx", providers=["CPUExecutionProvider"]
    )
    print("RDY", flush=True)

    for line in sys.stdin:
        if line.startswith("S"):
            # start cmd rec
            t1 = t.time()
            mPath = line[len("S"):].strip()
            #print(f"path: {mPath}", flush=True)

            samples, sr = sf.read(mPath, dtype='float32', always_2d=True)
            samples = samples[:, 0]  # Use only the first channel if stereo
            if sr != 44100:
                samples = librosa.resample(samples, orig_sr=sr, target_sr=44100)

            
            SAMPLE_LEN = 5
            NUM_SAMPLES = SAMPLE_LEN * 44100
            sampleStack = []
            mseStack = []

            for k in range(0, len(samples), NUM_SAMPLES * 2):
                s = samples[k:k+NUM_SAMPLES]
                # print(len(s))
                if len(s) >= NUM_SAMPLES:
                    melSpectrogram = librosa.feature.melspectrogram(
                        y=np.array(s),
                        sr=44100,
                        n_fft=2048,
                        hop_length=512,
                        n_mels=128,
                        power=2.0, 
                        htk=True,
                        norm=None
                    )
                    melDb = librosa.power_to_db(melSpectrogram, top_db=80)
                    sampleStack += [np.expand_dims(melDb, axis=0)]  # add mono channel
                    mseStack += [np.mean(librosa.feature.rms(y=np.array(s)))]
                del(s)

            #print(len(sampleStack), flush=True)
            onnxruntime_outputs = ort_session.run(None, {'input':np.array(sampleStack)})[0]
            x = 0
            totalArousal = 0
            totalValence = 0
            for i in onnxruntime_outputs:
                #print(f"At {x}s: {i} {mseStack[x // 5]}")
                totalArousal += (i[0] * mseStack[x // 5])
                totalValence += (i[1] * mseStack[x // 5])
                x += 5
            t2 = t.time()
            avgArousal = (totalArousal / (x / 5)) * 100
            avgValence = (totalValence / (x / 5)) * 100
            print(avgArousal, avgValence, flush=True)
            #print(f"Avg arousal: {avgArousal}")
            #print(f"Avg valence: {avgValence}")
            #print(f"Processing time: {t2 - t1} seconds")

            print("OK\r\n", flush=True)
        else:
            print("E0", flush=True)

if __name__ == "__main__":
    main()
