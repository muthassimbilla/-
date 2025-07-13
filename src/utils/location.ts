import { DeviceLocation } from "../types";

export const getDeviceLocation = async (): Promise<
  [DeviceLocation, boolean]
> => {
  try {
    const service = "https://ipwho.is/";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(service, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return [
        {
          country: data.country || "Unknown",
          region: data.region || "Unknown",
          city: data.city || "Unknown",
          ip: data.ip || "Unknown",
          timezone:
            data.timezone?.id ||
            Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        false,
      ];
    }

    throw new Error(`Failed to fetch location data: ${response.statusText}`);
  } catch (error) {
    console.warn("Location service failed:", error);
    // Fallback to basic browser info
    return [
      {
        country: "Unknown",
        region: "Unknown",
        city: "Unknown",
        ip: "Unknown",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      true,
    ];
  }
};

export const formatLocation = (location?: DeviceLocation): string => {
  if (!location) return "Unknown Location";

  const parts = [location.city, location.region, location.country].filter(
    part => part && part !== "Unknown"
  );

  return parts.length > 0 ? parts.join(", ") : "Unknown Location";
};
