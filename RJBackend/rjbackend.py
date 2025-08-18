import sys
import os
from librosa.feature import melspectrogram
from librosa import power_to_db
from onnxruntime import InferenceSession 

def main():
    print("Loaded", flush=True)
    for line in sys.stdin:
        if line.startswith("S"):
            # start cmd rec
            dir = line[len("S"):].strip()
            print(dir)
            if os.path.isdir(dir):
                print("OK DIR")
                #scanProc = mp.Process(target=reader.analyse, args=(earlyKill, dir))
                #scanProc.start()
                # scanProc.join()
            else:
                print("E0", flush=True)
        else:
            print("E0", flush=True)

if __name__ == "__main__":
    main()
