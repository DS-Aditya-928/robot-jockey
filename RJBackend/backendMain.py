import sys
import os
import multiprocessing as mp
import reader

def main():
    mp.freeze_support()
    earlyKill = mp.Value('b', False)
    for line in sys.stdin:
        if(line.find("S") == 0):
            #start cmd rec
            dir = line[len("S"):]
            dir = dir.strip()
            print(dir)
            if(os.path.isdir(dir)):
                print("OK DIR")
                scanProc = mp.Process(target = reader.analyse, args = (earlyKill, dir))
                scanProc.start()
                #scanProc.join()      
            else:
                print("E0")
        else:
            print("E0")
if __name__ == "__main__":
    main()