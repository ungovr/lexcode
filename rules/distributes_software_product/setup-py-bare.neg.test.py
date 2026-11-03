# lexcode-expect: 0
import subprocess
import sys


def setup(console, retries=3):
    for attempt in range(retries):
        console.write(f"setup attempt {attempt}\n")
        result = subprocess.run([sys.executable, "-m", "pip", "check"], capture_output=True)
        if result.returncode == 0:
            return True
    return False


def configure(console):
    return setup(console, retries=2)


def setup_logging(name, level="INFO"):
    return {"name": name, "level": level}
