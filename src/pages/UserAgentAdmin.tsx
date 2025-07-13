import React, { useState, useEffect } from "react";
import { Shield, Smartphone, Settings, Phone } from "lucide-react";
import SecurityPopup from "../components/SecurityPopup";
import { supabase } from "../utils/supabase";
import {
  Table,
  Button,
  Input,
  Switch,
  message,
  Select,
  InputNumber,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

interface DeviceConfig {
  id: string;
  device_type: "iphone" | "samsung";
  model: string;
  min_version: string;
  max_version: string;
  build_number: string;
  enabled: boolean;
}

interface VersionConfig {
  id: string;
  device_type: string;
  version: string;
  build: string;
  webkit: string;
  enabled: boolean;
}

interface AppConfig {
  id: string;
  device_type: string;
  app_type: "fb" | "chrome";
  major_version: string;
  min_build: number;
  max_build: number;
  enabled: boolean;
}

const UserAgentAdmin: React.FC = () => {
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error" | "warning">(
    "success"
  );

  const ADMIN_PASSWORD = "adminbilla";

  // Add tab state
  const [activeTab, setActiveTab] = useState<"iphone" | "samsung">("iphone");

  const [deviceConfigs, setDeviceConfigs] = useState<DeviceConfig[]>([]);
  const [versionConfigs, setVersionConfigs] = useState<VersionConfig[]>([]);
  const [appConfigs, setAppConfigs] = useState<AppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchConfigs();
    }
  }, [isAdminAuthenticated]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Starting to fetch configurations...");

      // Check Supabase initialization
      if (!supabase) {
        throw new Error("Supabase client is not initialized");
      }

      // Fetch device configs
      console.log("📱 Fetching device configs...");
      const { data: deviceData, error: deviceError } = await supabase
        .from("device_configs")
        .select("*");

      if (deviceError) {
        console.error("❌ Device configs error:", deviceError);
        console.error("Error details:", {
          code: deviceError.code,
          message: deviceError.message,
          details: deviceError.details,
          hint: deviceError.hint,
        });
        throw new Error(
          `Failed to fetch device configs: ${deviceError.message}`
        );
      }
      console.log(
        "✅ Device configs fetched:",
        deviceData?.length || 0,
        "records"
      );
      console.log("📱 Device data:", deviceData);
      setDeviceConfigs(deviceData || []);

      // Fetch version configs
      console.log("🔢 Fetching version configs...");
      const { data: versionData, error: versionError } = await supabase
        .from("version_configs")
        .select("*");

      if (versionError) {
        console.error("❌ Version configs error:", versionError);
        console.error("Error details:", {
          code: versionError.code,
          message: versionError.message,
          details: versionError.details,
          hint: versionError.hint,
        });
        throw new Error(
          `Failed to fetch version configs: ${versionError.message}`
        );
      }
      console.log(
        "✅ Version configs fetched:",
        versionData?.length || 0,
        "records"
      );
      console.log("🔢 Version data:", versionData);
      setVersionConfigs(versionData || []);

      // Fetch app configs
      console.log("📱 Fetching app configs...");
      const { data: appData, error: appError } = await supabase
        .from("app_configs")
        .select("*");

      if (appError) {
        console.error("❌ App configs error:", appError);
        console.error("Error details:", {
          code: appError.code,
          message: appError.message,
          details: appError.details,
          hint: appError.hint,
        });
        throw new Error(`Failed to fetch app configs: ${appError.message}`);
      }
      console.log("✅ App configs fetched:", appData?.length || 0, "records");
      console.log("📱 App data:", appData);
      setAppConfigs(appData || []);

      console.log("✅ All configurations fetched successfully!");
    } catch (error) {
      console.error("❌ Error fetching configurations:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      showPopupMessage(
        "Failed to fetch configurations. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const showPopupMessage = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      showPopupMessage("Admin access granted!", "success");
    } else {
      showPopupMessage("Invalid admin password!", "error");
      setAdminPassword("");
    }
  };

  // Add new device config
  const addDeviceConfig = async (deviceType: "iphone" | "samsung") => {
    try {
      console.log("➕ Adding new device config for:", deviceType);
      const newConfig = {
        device_type: deviceType,
        model: "",
        min_version: "",
        max_version: "",
        build_number: "",
        enabled: true,
      };

      const { data, error } = await supabase
        .from("device_configs")
        .insert([newConfig])
        .select();

      if (error) {
        console.error("❌ Error adding device config:", error);
        throw error;
      }

      console.log("✅ Added device config:", data);
      setDeviceConfigs([...deviceConfigs, ...(data || [])]);
      showPopupMessage(
        "New device configuration added successfully",
        "success"
      );
    } catch (error) {
      console.error("❌ Failed to add device configuration:", error);
      showPopupMessage("Failed to add device configuration", "error");
    }
  };

  // Update device config
  const updateDeviceConfig = async (config: DeviceConfig) => {
    try {
      const { error } = await supabase
        .from("device_configs")
        .update(config)
        .eq("id", config.id);

      if (error) throw error;

      setDeviceConfigs(
        deviceConfigs.map(c => (c.id === config.id ? config : c))
      );
      message.success("Device configuration updated");
    } catch (error) {
      message.error("Failed to update device configuration");
      console.error(error);
    }
  };

  // Delete device config
  const deleteDeviceConfig = async (id: string) => {
    try {
      const { error } = await supabase
        .from("device_configs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDeviceConfigs(deviceConfigs.filter(c => c.id !== id));
      message.success("Device configuration deleted");
    } catch (error) {
      message.error("Failed to delete device configuration");
      console.error(error);
    }
  };

  // Add version config
  const addVersionConfig = async (deviceType: "iphone" | "samsung") => {
    try {
      const newConfig = {
        device_type: deviceType,
        version: "",
        build: "",
        webkit: "",
        enabled: true,
      };

      const { data, error } = await supabase
        .from("version_configs")
        .insert([newConfig])
        .select();

      if (error) throw error;

      setVersionConfigs([...versionConfigs, ...(data || [])]);
      message.success("New version configuration added");
    } catch (error) {
      message.error("Failed to add version configuration");
      console.error(error);
    }
  };

  // Update version config
  const updateVersionConfig = async (config: VersionConfig) => {
    try {
      const { error } = await supabase
        .from("version_configs")
        .update(config)
        .eq("id", config.id);

      if (error) throw error;

      setVersionConfigs(
        versionConfigs.map(c => (c.id === config.id ? config : c))
      );
      message.success("Version configuration updated");
    } catch (error) {
      message.error("Failed to update version configuration");
      console.error(error);
    }
  };

  // Delete version config
  const deleteVersionConfig = async (id: string) => {
    try {
      const { error } = await supabase
        .from("version_configs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setVersionConfigs(versionConfigs.filter(c => c.id !== id));
      message.success("Version configuration deleted");
    } catch (error) {
      message.error("Failed to delete version configuration");
      console.error(error);
    }
  };

  // Add app config
  const addAppConfig = async (deviceType: "iphone" | "samsung") => {
    try {
      const newConfig = {
        device_type: deviceType,
        app_type: "fb",
        major_version: "",
        min_build: 0,
        max_build: 0,
        enabled: true,
      };

      const { data, error } = await supabase
        .from("app_configs")
        .insert([newConfig])
        .select();

      if (error) throw error;

      setAppConfigs([...appConfigs, ...(data || [])]);
      message.success("New app configuration added");
    } catch (error) {
      message.error("Failed to add app configuration");
      console.error(error);
    }
  };

  // Update app config
  const updateAppConfig = async (config: AppConfig) => {
    try {
      const { error } = await supabase
        .from("app_configs")
        .update(config)
        .eq("id", config.id);

      if (error) throw error;

      setAppConfigs(appConfigs.map(c => (c.id === config.id ? config : c)));
      message.success("App configuration updated");
    } catch (error) {
      message.error("Failed to update app configuration");
      console.error(error);
    }
  };

  // Delete app config
  const deleteAppConfig = async (id: string) => {
    try {
      const { error } = await supabase
        .from("app_configs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAppConfigs(appConfigs.filter(c => c.id !== id));
      message.success("App configuration deleted");
    } catch (error) {
      message.error("Failed to delete app configuration");
      console.error(error);
    }
  };

  const appColumns = [
    {
      title: "Device Type",
      dataIndex: "device_type",
      key: "device_type",
    },
    {
      title: "App Type",
      dataIndex: "app_type",
      key: "app_type",
      render: (_: any, record: AppConfig) => (
        <Select
          value={record.app_type}
          onChange={(value: "fb" | "chrome") => {
            const updated = { ...record, app_type: value };
            updateAppConfig(updated);
          }}
        >
          <Select.Option value="fb">Facebook</Select.Option>
          <Select.Option value="chrome">Chrome</Select.Option>
        </Select>
      ),
    },
    {
      title: "Major Version",
      dataIndex: "major_version",
      key: "major_version",
      render: (text: string, record: AppConfig) => (
        <Input
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const updated = { ...record, major_version: e.target.value };
            updateAppConfig(updated);
          }}
        />
      ),
    },
    {
      title: "Min Build",
      dataIndex: "min_build",
      key: "min_build",
      render: (value: number, record: AppConfig) => (
        <InputNumber
          value={value}
          onChange={(value: number | null) => {
            const updated = { ...record, min_build: value || 0 };
            updateAppConfig(updated);
          }}
        />
      ),
    },
    {
      title: "Max Build",
      dataIndex: "max_build",
      key: "max_build",
      render: (value: number, record: AppConfig) => (
        <InputNumber
          value={value}
          onChange={(value: number | null) => {
            const updated = { ...record, max_build: value || 0 };
            updateAppConfig(updated);
          }}
        />
      ),
    },
    {
      title: "Enabled",
      dataIndex: "enabled",
      key: "enabled",
      render: (checked: boolean, record: AppConfig) => (
        <Switch
          checked={checked}
          onChange={(checked: boolean) => {
            const updated = { ...record, enabled: checked };
            updateAppConfig(updated);
          }}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: AppConfig) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => deleteAppConfig(record.id)}
        />
      ),
    },
  ];

  const versionColumns = [
    {
      title: "Device Type",
      dataIndex: "device_type",
      key: "device_type",
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      render: (text: string, record: VersionConfig) => (
        <Input
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const updated = { ...record, version: e.target.value };
            updateVersionConfig(updated);
          }}
        />
      ),
    },
    {
      title: "Build",
      dataIndex: "build",
      key: "build",
      render: (text: string, record: VersionConfig) => (
        <Input
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const updated = { ...record, build: e.target.value };
            updateVersionConfig(updated);
          }}
        />
      ),
    },
    {
      title: "WebKit",
      dataIndex: "webkit",
      key: "webkit",
      render: (text: string, record: VersionConfig) => (
        <Input
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const updated = { ...record, webkit: e.target.value };
            updateVersionConfig(updated);
          }}
        />
      ),
    },
    {
      title: "Enabled",
      dataIndex: "enabled",
      key: "enabled",
      render: (checked: boolean, record: VersionConfig) => (
        <Switch
          checked={checked}
          onChange={(checked: boolean) => {
            const updated = { ...record, enabled: checked };
            updateVersionConfig(updated);
          }}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: VersionConfig) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => deleteVersionConfig(record.id)}
        />
      ),
    },
  ];

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <p className="text-gray-600 mt-2">Restricted Access Area</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder="Enter admin password"
                  required
                />
                <Shield
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transform hover:scale-[1.02] transition-all duration-200 font-medium text-lg flex items-center justify-center"
            >
              <Shield className="mr-2" size={20} />
              Access Admin Panel
            </button>
          </form>
        </div>

        <SecurityPopup
          show={showPopup}
          message={popupMessage}
          type={popupType}
          onClose={() => setShowPopup(false)}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
          <div className="text-red-500 text-center mb-4">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
            <p className="text-gray-600">{error}</p>
          </div>
          <button
            onClick={() => {
              setError(null);
              fetchConfigs();
            }}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const deviceColumns = [
    {
      title: "Device Type",
      dataIndex: "device_type",
      key: "device_type",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      render: (text: string, record: DeviceConfig) => (
        <Input
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const updated = { ...record, model: e.target.value };
            updateDeviceConfig(updated);
          }}
        />
      ),
    },
    {
      title: "Min Version",
      dataIndex: "min_version",
      key: "min_version",
      render: (text: string, record: DeviceConfig) => (
        <Input
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const updated = { ...record, min_version: e.target.value };
            updateDeviceConfig(updated);
          }}
        />
      ),
    },
    {
      title: "Max Version",
      dataIndex: "max_version",
      key: "max_version",
      render: (text: string, record: DeviceConfig) => (
        <Input
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const updated = { ...record, max_version: e.target.value };
            updateDeviceConfig(updated);
          }}
        />
      ),
    },
    {
      title: "Build Number",
      dataIndex: "build_number",
      key: "build_number",
      render: (text: string, record: DeviceConfig) => (
        <Input
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const updated = { ...record, build_number: e.target.value };
            updateDeviceConfig(updated);
          }}
        />
      ),
    },
    {
      title: "Enabled",
      dataIndex: "enabled",
      key: "enabled",
      render: (checked: boolean, record: DeviceConfig) => (
        <Switch
          checked={checked}
          onChange={(checked: boolean) => {
            const updated = { ...record, enabled: checked };
            updateDeviceConfig(updated);
          }}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: DeviceConfig) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => deleteDeviceConfig(record.id)}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  User Agent Admin
                </h1>
                <p className="text-gray-600">
                  Manage device configurations and settings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Device Type Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveTab("iphone")}
              className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl transition-all duration-200 ${
                activeTab === "iphone"
                  ? "bg-blue-500 text-white shadow-lg transform scale-[1.02]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Phone className="mr-3" size={24} />
              <span className="text-lg font-medium">iPhone Configuration</span>
            </button>
            <button
              onClick={() => setActiveTab("samsung")}
              className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl transition-all duration-200 ${
                activeTab === "samsung"
                  ? "bg-blue-500 text-white shadow-lg transform scale-[1.02]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Smartphone className="mr-3" size={24} />
              <span className="text-lg font-medium">Samsung Configuration</span>
            </button>
          </div>

          {/* Content Sections */}
          <div className="bg-gray-50 rounded-xl p-6">
            {activeTab === "iphone" ? (
              <div className="space-y-8">
                {/* Device Configurations */}
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center text-gray-800">
                      <Phone className="mr-3 text-blue-500" size={28} />
                      Device Configurations
                    </h2>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => addDeviceConfig("iphone")}
                    >
                      Add Device
                    </Button>
                  </div>
                  <Table
                    dataSource={deviceConfigs.filter(
                      c => c.device_type === "iphone"
                    )}
                    columns={deviceColumns}
                    loading={loading}
                  />
                </div>

                {/* Version Configurations */}
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center text-gray-800">
                      <Settings className="mr-3 text-blue-500" size={28} />
                      Version Configurations
                    </h2>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => addVersionConfig("iphone")}
                    >
                      Add Version
                    </Button>
                  </div>
                  <Table
                    dataSource={versionConfigs.filter(
                      c => c.device_type === "iphone"
                    )}
                    columns={versionColumns}
                    loading={loading}
                  />
                </div>

                {/* App Configurations */}
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center text-gray-800">
                      <Settings className="mr-3 text-blue-500" size={28} />
                      App Configurations
                    </h2>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => addAppConfig("iphone")}
                    >
                      Add App
                    </Button>
                  </div>
                  <Table
                    dataSource={appConfigs.filter(
                      c => c.device_type === "iphone"
                    )}
                    columns={appColumns}
                    loading={loading}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Device Configurations */}
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center text-gray-800">
                      <Smartphone className="mr-3 text-blue-500" size={28} />
                      Device Configurations
                    </h2>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => addDeviceConfig("samsung")}
                    >
                      Add Device
                    </Button>
                  </div>
                  <Table
                    dataSource={deviceConfigs.filter(
                      c => c.device_type === "samsung"
                    )}
                    columns={deviceColumns}
                    loading={loading}
                  />
                </div>

                {/* Version Configurations */}
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center text-gray-800">
                      <Settings className="mr-3 text-blue-500" size={28} />
                      Version Configurations
                    </h2>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => addVersionConfig("samsung")}
                    >
                      Add Version
                    </Button>
                  </div>
                  <Table
                    dataSource={versionConfigs.filter(
                      c => c.device_type === "samsung"
                    )}
                    columns={versionColumns}
                    loading={loading}
                  />
                </div>

                {/* App Configurations */}
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center text-gray-800">
                      <Settings className="mr-3 text-blue-500" size={28} />
                      App Configurations
                    </h2>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => addAppConfig("samsung")}
                    >
                      Add App
                    </Button>
                  </div>
                  <Table
                    dataSource={appConfigs.filter(
                      c => c.device_type === "samsung"
                    )}
                    columns={appColumns}
                    loading={loading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SecurityPopup Component */}
      <SecurityPopup
        show={showPopup}
        message={popupMessage}
        type={popupType}
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
};

export default UserAgentAdmin;
