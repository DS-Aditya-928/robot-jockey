import os
import time

def analyse(earlyKill, dir):
    print("T")
    for dirpath, dirnames, filenames in os.walk(dir):
        print(filenames)
    while(True):
        print("x")
        time.sleep(1)
    return

def test():
    print("Testicular Torsion")