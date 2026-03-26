import sys, os, traceback
sys.path.insert(0, r"C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline")
os.chdir(r"C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline")

import importlib.util
spec = importlib.util.spec_from_file_location("vo", r"C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\vehicle-osint.py")
vo = importlib.util.module_from_spec(spec)
sys.modules["vo"] = vo
spec.loader.exec_module(vo)

try:
    result = vo.run_vehicle_osint("AJ05RCF", None)
    print(f"Result: {result!r}", flush=True)
except SystemExit:
    print("SystemExit caught", flush=True)
except Exception:
    traceback.print_exc()
