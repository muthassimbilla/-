import { supabase } from "./supabase";

interface DeviceConfig {
  device_type: "iphone" | "samsung";
  model: string;
  min_version: string;
  max_version: string;
  build_number: string;
  enabled: boolean;
}

interface VersionConfig {
  device_type: string;
  version: string;
  build: string;
  webkit: string;
  enabled: boolean;
}

interface AppConfig {
  device_type: string;
  app_type: "fb" | "chrome";
  major_version: string;
  min_build: number;
  max_build: number;
  enabled: boolean;
}

// Helper function to parse version string
const parseVersion = (version: string): number[] => {
  return version.split(".").map(Number);
};

// Helper function to compare versions
const compareVersions = (v1: string, v2: string): number => {
  const parts1 = parseVersion(v1);
  const parts2 = parseVersion(v2);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 !== part2) return part1 - part2;
  }
  return 0;
};

// Helper function to generate random number in range
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to choose random item from array
const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const generateIphoneUA = async (): Promise<string> => {
  try {
    // Fetch all required configurations
    const { data: devices } = await supabase
      .from("device_configs")
      .select("*")
      .eq("device_type", "iphone")
      .eq("enabled", true);

    const { data: versions } = await supabase
      .from("version_configs")
      .select("*")
      .eq("device_type", "iphone")
      .eq("enabled", true);

    const { data: apps } = await supabase
      .from("app_configs")
      .select("*")
      .eq("device_type", "iphone")
      .eq("app_type", "fb")
      .eq("enabled", true);

    if (!devices?.length || !versions?.length || !apps?.length) {
      throw new Error("Missing required configurations");
    }

    // Select random device
    const device = randomChoice(devices);

    // Filter compatible versions
    const compatibleVersions = versions.filter(
      (v: VersionConfig) =>
        compareVersions(v.version, (device as DeviceConfig).min_version) >= 0 &&
        compareVersions(v.version, (device as DeviceConfig).max_version) <= 0
    );

    if (!compatibleVersions.length) {
      throw new Error("No compatible versions found");
    }

    // Select random version
    const version = randomChoice(compatibleVersions) as VersionConfig;

    // Select random app version
    const app = randomChoice(apps) as AppConfig;
    const fbav = `${app.major_version}.${randomInt(0, 1)}.0.${randomInt(
      30,
      59
    )}.${randomInt(40, 99)}`;
    const fbbv = randomInt(app.min_build, app.max_build).toString();

    // Additional parameters
    const fbss = randomChoice(["2", "3"]);
    const language = randomChoice(["en_US", "es_US"]);
    const fbrv = randomInt(741881359, 746450682).toString();

    // Build the user agent string
    return (
      `Mozilla/5.0 (iPhone; CPU iPhone OS ${version.version.replace(
        ".",
        "_"
      )} like Mac OS X) ` +
      `AppleWebKit/${version.webkit} (KHTML, like Gecko) Mobile/${version.build} ` +
      `[FBAN/FBIOS;FBAV/${fbav};FBBV/${fbbv};FBDV/${
        (device as DeviceConfig).model
      };FBMD/iPhone;` +
      `FBSN/iOS;FBSV/${version.version};FBSS/${fbss};FBID/phone;FBLC/${language};` +
      `FBOP/5;FBRV/${fbrv};IABMV/1]`
    );
  } catch (error) {
    console.error("Error generating iPhone UA:", error);
    throw error;
  }
};

export const generateSamsungUA = async (): Promise<string> => {
  try {
    // Fetch all required configurations
    const { data: devices } = await supabase
      .from("device_configs")
      .select("*")
      .eq("device_type", "samsung")
      .eq("enabled", true);

    const { data: versions } = await supabase
      .from("version_configs")
      .select("*")
      .eq("device_type", "samsung")
      .eq("enabled", true);

    const { data: fbApps } = await supabase
      .from("app_configs")
      .select("*")
      .eq("device_type", "samsung")
      .eq("app_type", "fb")
      .eq("enabled", true);

    const { data: chromeApps } = await supabase
      .from("app_configs")
      .select("*")
      .eq("device_type", "samsung")
      .eq("app_type", "chrome")
      .eq("enabled", true);

    if (
      !devices?.length ||
      !versions?.length ||
      !fbApps?.length ||
      !chromeApps?.length
    ) {
      throw new Error("Missing required configurations");
    }

    // Select random configurations
    const device = randomChoice(devices) as DeviceConfig;
    const version = randomChoice(versions) as VersionConfig;
    const fbApp = randomChoice(fbApps) as AppConfig;
    const chromeApp = randomChoice(chromeApps) as AppConfig;

    // Generate version strings
    const fbav = `${fbApp.major_version}.${randomInt(0, 1)}.0.${randomInt(
      30,
      59
    )}.${randomInt(40, 99)}`;
    const chromeVersion = `${chromeApp.major_version}.0.${randomInt(
      4000,
      4999
    )}.${randomInt(50, 150)}`;

    // Build the user agent string
    return (
      `Mozilla/5.0 (Linux; Android ${version.version}; ${device.model} Build/${device.build_number}; wv) ` +
      `AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 ` +
      `Chrome/${chromeVersion} Mobile Safari/537.36 ` +
      `[FB_IAB/FB4A;FBAV/${fbav};IABMV/1;]`
    );
  } catch (error) {
    console.error("Error generating Samsung UA:", error);
    throw error;
  }
};

// Function to generate multiple user agents
export const generateUserAgents = async (
  count: number,
  deviceConfigs: { type: string; percentage: number; enabled: boolean }[]
): Promise<string[]> => {
  try {
    const userAgents: string[] = [];
    const enabledDevices = deviceConfigs.filter(
      d => d.enabled && d.percentage > 0
    );

    if (enabledDevices.length === 0) {
      throw new Error("No enabled devices configured");
    }

    // Normalize percentages
    const totalPercentage = enabledDevices.reduce(
      (sum, d) => sum + d.percentage,
      0
    );
    const normalizedDevices = enabledDevices.map(d => ({
      ...d,
      count: Math.round((d.percentage / totalPercentage) * count),
    }));

    // Generate UAs for each device type
    for (const device of normalizedDevices) {
      const generator =
        device.type === "iphone" ? generateIphoneUA : generateSamsungUA;

      for (let i = 0; i < device.count; i++) {
        const ua = await generator();
        userAgents.push(ua);
      }
    }

    // Handle rounding errors
    while (userAgents.length < count) {
      const generator =
        randomChoice(enabledDevices).type === "iphone"
          ? generateIphoneUA
          : generateSamsungUA;
      const ua = await generator();
      userAgents.push(ua);
    }

    // Shuffle the array
    for (let i = userAgents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [userAgents[i], userAgents[j]] = [userAgents[j], userAgents[i]];
    }

    return userAgents.slice(0, count);
  } catch (error) {
    console.error("Error generating user agents:", error);
    throw error;
  }
};

export const generateMotorolaUA = async (): Promise<string> => {
  try {
    // Generate a Motorola user agent
    const androidVersions = ["10", "11", "12", "13"];
    const androidVersion = randomChoice(androidVersions);

    const motorolaModels = [
      "moto g(9) play",
      "moto g(8) power",
      "moto g power (2021)",
      "moto g stylus",
      "moto g(7) plus",
      "moto e(7) plus",
      "moto g(60)",
      "moto edge 20",
    ];
    const model = randomChoice(motorolaModels);

    const buildNumbers = [
      "QPX30.54-22",
      "RPBS31.Q1-19-19-4",
      "RPNS31.Q1-21-20-5",
      "QPHS30.29-Q3-28-13",
    ];
    const buildNumber = randomChoice(buildNumbers);

    // Generate Facebook app version
    const fbMajorVersion = randomChoice(["398", "399", "400", "401"]);
    const fbav = `${fbMajorVersion}.0.0.${randomInt(24, 37)}.${randomInt(
      70,
      120
    )}`;
    const fbbv = randomInt(991116271, 991316271).toString();

    // Build the user agent string
    return (
      `Mozilla/5.0 (Linux; Android ${androidVersion}; ${model} Build/${buildNumber}; wv) ` +
      `AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 ` +
      `Chrome/${randomInt(108, 112)}.0.${randomInt(5000, 5999)}.${randomInt(
        70,
        134
      )} Mobile Safari/537.36 ` +
      `[FBAN/FB4A;FBAV/${fbav};FBBV/${fbbv};FBDM/{density=2.0,width=720,height=1440};` +
      `FBLC/en_US;FBRV/${randomInt(
        741881359,
        746450682
      )};FBCR/Motorola;FBMF/motorola;FBBD/motorola;` +
      `FBPN/com.facebook.katana;FBDV/${model};FBSV/${androidVersion};FBOP/1;FBCA/arm64-v8a:;]`
    );
  } catch (error) {
    console.error("Error generating Motorola UA:", error);
    throw error;
  }
};

export const generatePixelUA = async (): Promise<string> => {
  try {
    // Generate a Pixel user agent
    const androidVersions = ["12", "13", "14"];
    const androidVersion = randomChoice(androidVersions);

    const pixelModels = [
      "Pixel 6",
      "Pixel 6 Pro",
      "Pixel 7",
      "Pixel 7 Pro",
      "Pixel 7a",
      "Pixel 8",
      "Pixel 8 Pro",
    ];
    const model = randomChoice(pixelModels);

    const buildNumbers = [
      "TQ2A.230505.002",
      "TQ3A.230705.001",
      "UP1A.231005.007",
      "UQ1A.240105.004",
    ];
    const buildNumber = randomChoice(buildNumbers);

    // Generate Facebook app version
    const fbMajorVersion = randomChoice(["398", "399", "400", "401"]);
    const fbav = `${fbMajorVersion}.0.0.${randomInt(24, 37)}.${randomInt(
      70,
      120
    )}`;
    const fbbv = randomInt(991116271, 991316271).toString();

    // Build the user agent string
    return (
      `Mozilla/5.0 (Linux; Android ${androidVersion}; ${model} Build/${buildNumber}; wv) ` +
      `AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 ` +
      `Chrome/${randomInt(108, 112)}.0.${randomInt(5000, 5999)}.${randomInt(
        70,
        134
      )} Mobile Safari/537.36 ` +
      `[FBAN/FB4A;FBAV/${fbav};FBBV/${fbbv};FBDM/{density=2.625,width=1080,height=2400};` +
      `FBLC/en_US;FBRV/${randomInt(
        741881359,
        746450682
      )};FBCR/Google;FBMF/Google;FBBD/google;` +
      `FBPN/com.facebook.katana;FBDV/${model};FBSV/${androidVersion};FBOP/1;FBCA/arm64-v8a:;]`
    );
  } catch (error) {
    console.error("Error generating Pixel UA:", error);
    throw error;
  }
};
