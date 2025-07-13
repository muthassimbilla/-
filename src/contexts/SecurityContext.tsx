import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { sha256 } from "js-sha256";
import { ApiKey, UserProfile } from "../types";
import { getDeviceLocation } from "../utils/location";
import SecurityPopup from "../components/SecurityPopup";
import { apiKeysTable, isSupabaseInitialized } from "../utils/supabase";

// Theme context for dark mode
interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if user has a preference stored in localStorage
    const savedTheme = localStorage.getItem("theme");
    // Check if user prefers dark mode in their system settings
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    return savedTheme === "dark" || (!savedTheme && prefersDark);
  });

  useEffect(() => {
    // Apply dark mode class to the document
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Save preference to localStorage
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Security context
interface SecurityContextType {
  isAuthenticated: boolean;
  currentProfile: UserProfile | null;
  isLoading: boolean;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
  apiKeys: ApiKey[];
  addApiKey: (
    key: string,
    name: string,
    expiresAt: string | null
  ) => Promise<void>;
  removeApiKey: (id: string) => void;
  getDeviceFingerprint: () => string;
  triggerSecurityPopup: (
    message: string,
    type: "success" | "error" | "warning"
  ) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined
);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
};

// Utility function to map DB fields to camelCase
function mapApiKeyFromDb(dbKey: any): ApiKey {
  return {
    id: dbKey.id,
    key: dbKey.key,
    name: dbKey.name,
    deviceId: dbKey.device_id,
    deviceLocation: dbKey.device_location,
    createdAt: dbKey.created_at,
    expiresAt: dbKey.expires_at,
    isActive: dbKey.is_active,
    lastUsed: dbKey.last_used,
  };
}

export const SecurityProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(
    null
  );
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error" | "warning">(
    "warning"
  );
  const [showPopup, setShowPopup] = useState(false);
  const [hasSupabase, setHasSupabase] = useState(isSupabaseInitialized());

  const triggerSecurityPopup = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const getDeviceFingerprint = (): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("Device fingerprint", 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 0,
      (navigator as any).deviceMemory || 0,
    ].join("|");

    return sha256(fingerprint);
  };

  const isKeyExpired = (expiresAt: string | null | undefined): boolean => {
    if (!expiresAt) return false; // Unlimited validity, never expires
    return new Date() > new Date(expiresAt);
  };

  const getDaysUntilExpiry = (expiresAt: string | null | undefined): number => {
    if (!expiresAt) return Infinity; // Unlimited validity
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  useEffect(() => {
    const initializeKeys = async () => {
      try {
        setIsLoading(true);

        if (!hasSupabase) {
          console.warn("Supabase not initialized. Running in demo mode.");
          setIsLoading(false);
          return;
        }

        // Check authentication status
        const authStatus = sessionStorage.getItem("isAuthenticated");
        const savedProfile = sessionStorage.getItem("currentProfile");

        if (authStatus === "true" && savedProfile) {
          try {
            const profile = JSON.parse(savedProfile);
            if (!isKeyExpired(profile.expiresAt)) {
              // Fetch API keys first
              const keys = (await apiKeysTable.getAll()).map(mapApiKeyFromDb);
              setApiKeys(keys);

              // Verify the key still exists and is active
              const foundKey = keys.find(
                (k: ApiKey) => k.id === profile.id && k.isActive
              );
              if (foundKey) {
                setIsAuthenticated(true);
                setCurrentProfile({
                  ...profile,
                  isExpired: false,
                  daysUntilExpiry: getDaysUntilExpiry(profile.expiresAt),
                });
              } else {
                console.warn("Stored key no longer valid");
                logout();
              }
            } else {
              console.warn("Stored key expired");
              logout();
            }
          } catch (e) {
            console.error("Failed to parse saved profile", e);
            logout();
          }
        } else {
          // Just fetch API keys if not authenticated
          if (hasSupabase) {
            const keys = (await apiKeysTable.getAll()).map(mapApiKeyFromDb);
            setApiKeys(keys);
          }
        }
      } catch (e) {
        console.error("Failed to initialize security context", e);
        setApiKeys([]);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeKeys();
  }, [hasSupabase]);

  const login = async (key: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const deviceId = getDeviceFingerprint();
      const [currentLocation, hasError] = await getDeviceLocation();
      if (hasError) {
        console.warn("Location service unavailable during login");
      }

      // Always fetch latest keys from Supabase
      let keys = apiKeys;
      if (!keys.length) {
        try {
          keys = (await apiKeysTable.getAll()).map(mapApiKeyFromDb);
          setApiKeys(keys);
        } catch (e) {
          console.error("Failed to fetch API keys from Supabase", e);
          return false;
        }
      }

      const foundKey = keys.find(k => k.key === key && k.isActive);

      if (foundKey) {
        if (isKeyExpired(foundKey.expiresAt)) {
          alert("This access key has expired!");
          return false;
        }

        if (foundKey.deviceId === "" || foundKey.deviceId === deviceId) {
          // Bind key to device if not already bound
          if (foundKey.deviceId === "") {
            await apiKeysTable.update(foundKey.id, {
              device_id: deviceId,
              last_used: new Date().toISOString(),
            });
          } else {
            await apiKeysTable.update(foundKey.id, {
              last_used: new Date().toISOString(),
            });
          }

          // Update profile
          const profile: UserProfile = {
            id: foundKey.id,
            name: foundKey.name,
            deviceId,
            deviceLocation: currentLocation,
            createdAt: foundKey.createdAt,
            expiresAt: foundKey.expiresAt,
            lastUsed: new Date().toISOString(),
            isExpired: false,
            daysUntilExpiry: getDaysUntilExpiry(foundKey.expiresAt),
          };

          setCurrentProfile(profile);
          setIsAuthenticated(true);
          sessionStorage.setItem("isAuthenticated", "true");
          sessionStorage.setItem("currentProfile", JSON.stringify(profile));
          return true;
        } else {
          alert("This key is bound to a different device!");
        }
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentProfile(null);
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("currentProfile");
  };

  const addApiKey = async (
    key: string,
    name: string,
    expiresAt: string | null
  ) => {
    const [location, hasError] = await getDeviceLocation();
    if (hasError) {
      console.warn("Location service unavailable when adding key");
    }

    // Create the key object
    const newKey = {
      key,
      name,
      device_id: "",
      device_location: location,
      created_at: new Date().toISOString(),
      expires_at: expiresAt, // This can be null now that the database constraint has been removed
      is_active: true,
    };

    try {
      // Add the key to the database
      await apiKeysTable.add(newKey);
      // Refresh keys
      const updatedKeys = (await apiKeysTable.getAll()).map(mapApiKeyFromDb);
      setApiKeys(updatedKeys);
    } catch (error) {
      console.error("Error adding API key:", error);
      throw error;
    }
  };

  const removeApiKey = async (id: string) => {
    await apiKeysTable.remove(id);
    // Refresh keys
    const updatedKeys = (await apiKeysTable.getAll()).map(mapApiKeyFromDb);
    setApiKeys(updatedKeys);
  };

  return (
    <SecurityContext.Provider
      value={{
        isAuthenticated,
        currentProfile,
        isLoading,
        login,
        logout,
        apiKeys,
        addApiKey,
        removeApiKey,
        getDeviceFingerprint,
        triggerSecurityPopup,
      }}
    >
      {children}
      {showPopup && (
        <SecurityPopup
          show={showPopup}
          message={popupMessage}
          type={popupType}
          onClose={() => setShowPopup(false)}
        />
      )}
    </SecurityContext.Provider>
  );
};
