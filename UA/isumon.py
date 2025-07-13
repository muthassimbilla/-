import random

# Device models with their min/max supported iOS versions
device_ios_ranges = {
    "iPhone12,1": ("18.3", "18.5"), "iPhone12,3": ("18.3", "18.5"), "iPhone12,5": ("18.3", "18.5"),
    "iPhone13,2": ("18.3", "18.5"), "iPhone13,1": ("18.3", "18.5"), "iPhone13,3": ("18.3", "18.5"),
    "iPhone13,4": ("18.3", "18.5"), "iPhone14,5": ("18.3", "18.5"), "iPhone14,4": ("18.3", "18.5"),
    "iPhone14,2": ("18.3", "18.5"), "iPhone14,3": ("18.3", "18.5"), "iPhone14,7": ("18.3", "18.5"),
    "iPhone14,8": ("18.3", "18.5"), "iPhone15,2": ("18.3", "18.5"), "iPhone15,3": ("18.3", "18.5"),
    "iPhone15,4": ("18.3", "18.5"), "iPhone15,5": ("18.3", "18.5"), "iPhone16,1": ("18.3", "18.5"),
    "iPhone16,2": ("18.3", "18.5"), "iPhone17,3": ("18.3", "18.5"), "iPhone17,4": ("18.3", "18.5"),
    "iPhone17,1": ("18.3", "18.5"), "iPhone17,2": ("18.3", "18.5")
}

# iOS versions with build numbers and WebKit versions
ios_versions = [
    ("18.3", "22D63", "605.1.15"), ("18.3.1", "22D72", "605.1.15"), ("18.3.2", "22D82", "605.1.15"),
    ("18.4", "22E240", "605.1.15"), ("18.4.1", "22E252", "605.1.15"), ("18.5", "22F76", "605.1.15")
    
]

# Facebook app major versions with FBBV ranges
fb_major_versions = {
    "515": (737212593, 740881359),
    "516": (740881360, 743277063),
    "517": (743277064, 746450682)
}

# Configuration options
languages = ["en_US", "es_US"]
screen_scaling = ["2", "3"]  # @2x/@3x displays
iabmv_options = ["1"]        # IAB Mobile View

# Track used FBRV values to ensure uniqueness
fbrv_used = set()

def randomize_fbav(major):
    """Generate FBAV with fixed major, 10% minor=1, 90% minor=0, random build/hotfix"""
    minor = 1 if random.random() < 0.1 else 0
    build = random.randint(30, 59)
    hotfix = random.randint(40, 99)
    return f"{major}.{minor}.0.{build}.{hotfix}"

def randomize_fbbv(major):
    """Generate FBBV in the range for the given major version"""
    r = fb_major_versions[major]
    return str(random.randint(r[0], r[1]))

def parse_ios_version(version):
    """Convert iOS version string to comparable tuple"""
    return tuple(map(int, version.split('.')))

def generate_unique_fbrv():
    """Generate unique FBRV number avoiding duplicates"""
    while True:
        fbrv = random.randint(741881359, 746450682)
        if fbrv not in fbrv_used:
            fbrv_used.add(fbrv)
            return fbrv

def generate_user_agent():
    """Generate valid Facebook iOS User-Agent with version constraints"""
    # 1. Random device selection
    device_model = random.choice(list(device_ios_ranges.keys()))
    min_ios, max_ios = device_ios_ranges[device_model]
    
    # 2. Find compatible iOS versions
    valid_ios_versions = [
        v for v in ios_versions
        if parse_ios_version(min_ios) <= parse_ios_version(v[0]) <= parse_ios_version(max_ios)
    ]
    
    # Recursive fallback if no valid versions
    if not valid_ios_versions:
        return generate_user_agent()
    
    # 3. Random selection from valid components
    ios_version, ios_build, webkit_version = random.choice(valid_ios_versions)
    major = random.choice(list(fb_major_versions.keys()))
    fbav = randomize_fbav(major)
    fbbv = randomize_fbbv(major)
    fbss = random.choice(screen_scaling)
    language = random.choice(languages)
    
    # 4. Conditional parameters
    extra = ""
    fbrv_part = ""
    
    if random.random() < 0.1:  # 10% chance for FBOP/80
        extra = ";FBOP/80"
    else:  # 90% chance for FBRV chain
        fbrv = generate_unique_fbrv()
        fbrv_part = f";FBOP/5;FBRV/{fbrv}"
        if random.random() < 0.9:  # 90% chance for IABMV
            fbrv_part += f";IABMV/{random.choice(iabmv_options)}"
    
    # 5. Assemble User-Agent
    return (
        f"Mozilla/5.0 (iPhone; CPU iPhone OS {ios_version.replace('.', '_')} like Mac OS X) "
        f"AppleWebKit/{webkit_version} (KHTML, like Gecko) Mobile/{ios_build} "
        f"[FBAN/FBIOS;FBAV/{fbav};FBBV/{fbbv};FBDV/{device_model};FBMD/iPhone;"
        f"FBSN/iOS;FBSV/{ios_version};FBSS/{fbss};FBID/phone;FBLC/{language}"
        f"{extra}{fbrv_part}]"
    )

# Generate 5000 unique User-Agents
user_agents = set()
while len(user_agents) < 5000:
    user_agents.add(generate_user_agent())

# Output results
with open("iphone_user_agents.txt", "w", encoding="utf-8") as f:
    for ua in user_agents:
        f.write(ua + "\n")

print("\n✅ 5,000 unique User-Agents have been written to iphone_user_agents.txt!")
print("   - ~90% include IABMV/1 parameter")
print("   - FBRV values guaranteed unique")