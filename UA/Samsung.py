import random
import json

# Devices list
devices = [
    ("SM-G975U1", "12", "G975U1UEU8IWB6"),
    ("SM-G980U1", "13", "G980U1UEU2EVA2"),
    ("SM-G985U1", "13", "G985U1UES9HXE3"),
    ("SM-G988U1", "13", "G988U1UEU6HWHD"),
    ("SM-G991U1", "14", "G991U1UESCGXF3"),
    ("SM-G996U1", "13", "G996U1UEU9EWL2"),
    ("SM-G998U1", "14", "G998U1UESCGXF3"),
    ("SM-S908U1", "14", "S908U1UES6EXJ1"),
    ("SM-S911U1", "14", "S911U1UES5CXL7"),
    ("SM-S916U1", "14", "S916U1UES5CXL7"),
    ("SM-S918U1", "14", "S918U1UES5CXL7"),
    ("SM-S921U1", "14", "S921U1UES4AXL4"),
    ("SM-S926U1", "14", "S926U1UES3AXI1"),
    ("SM-S928U1", "14", "S928U1UES4AXL4"),
    ("SM-S931U1", "15", "S931U1UEU1AYA1"),
    ("SM-S936U1", "15", "S936U1UEU1AYA1"),
    ("SM-S938U1", "15", "S938U1UEU1AYA1"),
    ("SM-N970U1", "12", "N970U1UEU7HWB2"),
    ("SM-N975U1", "12", "G975U1UEU8IWB6"),
    ("SM-N980U1", "13", "N981U1UES7HXE3"),
    ("SM-N986U1", "13", "N986U1UESBHXL1"),
    ("SM-A515U1", "14", "A515USQSCFXA1"),
    ("SM-F916U1", "14", "F916U1UES7KXH1"),
    ("SM-F926U1", "14", "F926U1UES9JXLA"),
    ("SM-F936U1", "14", "F936U1UES7GXK5"),
    ("SM-F700U1", "14", "F700U1UES8JXA1"),
    ("SM-F711U1", "14", "F711U1TBSAJXLA"),
    ("SM-F721U1", "14", "F721U1UES8HYE3"),
]

# FBAV version generator
def get_fb_version(android_version):
    major_versions = ["517", "516"]
    weights = [0.7, 0.3]  # 70% chance for 517, 30% for 516
    major = random.choices(major_versions, weights)[0]

    if major == "517":
        # 10% chance of minor = 1, else 0
        minor = "1" if random.random() < 0.1 else "0"
    else:
        # Always minor 1 for 516 (you can change this if needed)
        minor = "1"

    base = f"{major}.{minor}.0"
    patch1 = str(random.randint(0, 99))
    patch2 = str(random.randint(0, 99))
    return f"{base}.{patch1}.{patch2}"

# Chrome version generator
def get_chrome_version():
    major = random.choice(["137.0", "136.0", "135.0"])
    build = random.randint(4000, 4999)
    patch = random.randint(50, 150)
    return f"{major}.{build}.{patch}"

# UA generation
user_agents = set()
max_tries = 100000
tries = 0

while len(user_agents) < 5000 and tries < max_tries:
    tries += 1
    model, android_ver, build = random.choice(devices)
    fb_version = get_fb_version(android_ver)
    iabmv = "IABMV/1" if fb_version.startswith("517") and android_ver in ["14", "15"] else "IABMV/1"
    chrome_version = get_chrome_version()

    ua = (
        f"Mozilla/5.0 (Linux; Android {android_ver}; {model} Build/{build}; wv) "
        f"AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 "
        f"Chrome/{chrome_version} Mobile Safari/537.36 "
        f"[FB_IAB/FB4A;FBAV/{fb_version};{iabmv};]"
    )

    user_agents.add(ua)

# Save to file
output_file = "usa_android_user_agents.txt"
with open(output_file, "w") as f:
    for ua in user_agents:
        f.write(ua + "\n")

print(f"✅ ইউনিক {len(user_agents)} টি Samsung Android Facebook UA তৈরি হয়েছে এবং ফাইলে সংরক্ষণ হয়েছে: {output_file}")
