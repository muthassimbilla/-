export interface ApiKey {
  id: string;
  key: string;
  name: string;
  deviceId: string;
  deviceLocation?: DeviceLocation;
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
  lastUsed?: string;
}

export interface DeviceLocation {
  country: string;
  region: string;
  city: string;
  ip: string;
  timezone: string;
}

export interface UserProfile {
  id: string;
  name: string;
  deviceId: string;
  deviceLocation?: DeviceLocation;
  createdAt: string;
  expiresAt: string | null;
  lastUsed: string;
  isExpired: boolean;
  daysUntilExpiry: number;
}

export enum DeviceType {
  iPhone = "iphone",
  Samsung = "samsung",
  Motorola = "motorola",
  Pixel = "pixel",
}

export interface DeviceConfig {
  versions: string[];
  builds: string[];
  fbVersions: string[];
}

export interface UAConfigs {
  [key: string]: {
    versions: string[];
    builds: string[];
    fbVersions: string[];
  };
}

export interface IosDeviceRange {
  id: number;
  deviceModel: string;
  minVersion: string;
  maxVersion: string;
  created_at?: string;
}

export interface IosVersion {
  id: number;
  version: string;
  build: string;
  webkit_version: string;
  created_at?: string;
}

export interface FbVersion {
  id: number;
  major: string;
  min_fbbv: number;
  max_fbbv: number;
  created_at?: string;
}

export interface SamsungDeviceConfig {
  id: number;
  model: string;
  android_version: string;
  build_number: string;
  created_at?: string;
}
