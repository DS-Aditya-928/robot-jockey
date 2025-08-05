import os
import time
from mutagen.easyid3 import EasyID3

def analyse(earlyKill, dir):
    print("T")
    for dirpath, dirnames, filenames in os.walk(dir):
        if(type(filenames) == list):
            for i in filenames:
                try:
                    x = EasyID3(os.path.join(dirpath, i))
                    if(x is not None):
                        print(x.keys())
                except Exception:
                    pass
                
                        