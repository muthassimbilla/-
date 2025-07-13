import React, { useState, useCallback } from "react";
import {
  Smartphone,
  Copy,
  Download,
  Trash2,
  Settings,
  RefreshCw,
  Check,
} from "lucide-react";
import SecurityPopup from "../components/SecurityPopup";
import * as XLSX from "xlsx/xlsx.mjs";
import { generateUserAgents } from "../utils/userAgentService";

interface DeviceConfig {
  type: "iphone" | "samsung" | "motorola" | "pixel";
  percentage: number;
  enabled: boolean;
}

interface GeneratedUA {
  userAgent: string;
  deviceType: "iphone" | "samsung" | "motorola" | "pixel";
  index: number;
}

const UserAgentGenerator: React.FC = () => {
  const [deviceConfigs, setDeviceConfigs] = useState<DeviceConfig[]>([
    { type: "iphone", percentage: 25, enabled: true },
    { type: "samsung", percentage: 25, enabled: true },
    { type: "motorola", percentage: 25, enabled: true },
    { type: "pixel", percentage: 25, enabled: true },
  ]);
  const [totalAmount, setTotalAmount] = useState(100);
  const [generatedUserAgents, setGeneratedUserAgents] = useState<GeneratedUA[]>(
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error" | "warning">(
    "success"
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const showPopupMessage = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const updateDevicePercentage = (
    deviceType: "iphone" | "samsung" | "motorola" | "pixel",
    percentage: number
  ) => {
    setDeviceConfigs(prev => {
      const newConfigs = [...prev];
      const deviceIndex = newConfigs.findIndex(d => d.type === deviceType);

      if (deviceIndex !== -1) {
        const newPercentage = Math.max(0, Math.min(100, percentage));
        newConfigs[deviceIndex].percentage = newPercentage;

        // Auto-enable device if percentage is set above 0
        if (newPercentage > 0) {
          newConfigs[deviceIndex].enabled = true;
        }
        // Auto-disable device if percentage is set to 0
        else {
          newConfigs[deviceIndex].enabled = false;
        }
      }

      return newConfigs;
    });
  };

  // Auto-balance percentages when devices are enabled/disabled
  const autoBalancePercentages = () => {
    setDeviceConfigs(prev => {
      const newConfigs = [...prev];
      const enabledDevices = newConfigs.filter(d => d.enabled);

      if (enabledDevices.length === 0) return newConfigs;

      const equalPercentage = Math.floor(100 / enabledDevices.length);
      const remainder = 100 - equalPercentage * enabledDevices.length;

      newConfigs.forEach((config, index) => {
        if (config.enabled) {
          config.percentage = equalPercentage + (index < remainder ? 1 : 0);
        } else {
          config.percentage = 0;
        }
      });

      return newConfigs;
    });
  };

  const handleGenerate = useCallback(async () => {
    const enabledDevices = deviceConfigs.filter(
      d => d.enabled && d.percentage > 0
    );

    if (enabledDevices.length === 0) {
      showPopupMessage(
        "Please set percentages for at least one device type!",
        "warning"
      );
      return;
    }

    if (totalAmount < 1 || totalAmount > 10000) {
      showPopupMessage("Total amount must be between 1 and 10,000!", "warning");
      return;
    }

    setIsGenerating(true);

    try {
      const userAgents = await generateUserAgents(totalAmount, deviceConfigs);

      setGeneratedUserAgents(
        userAgents.map((userAgent, index) => ({
          userAgent,
          deviceType: userAgent.includes("iPhone") ? "iphone" : "samsung",
          index,
        }))
      );

      showPopupMessage(
        `Generated ${userAgents.length} user agents successfully!`,
        "success"
      );
    } catch (error) {
      console.error("Error generating user agents:", error);
      showPopupMessage("Failed to generate user agents!", "error");
    } finally {
      setIsGenerating(false);
    }
  }, [deviceConfigs, totalAmount]);

  const copyToClipboard = async () => {
    if (generatedUserAgents.length === 0) {
      showPopupMessage("No user agents to copy!", "warning");
      return;
    }

    try {
      await navigator.clipboard.writeText(
        generatedUserAgents.map(ua => ua.userAgent).join("\n")
      );
      showPopupMessage("All user agents copied to clipboard!", "success");
    } catch (err) {
      showPopupMessage("Failed to copy user agents!", "error");
    }
  };

  const copyIndividualUA = async (userAgent: string, index: number) => {
    try {
      await navigator.clipboard.writeText(userAgent);
      setCopiedIndex(index);
      showPopupMessage(`User agent #${index + 1} copied!`, "success");

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (err) {
      showPopupMessage("Failed to copy user agent!", "error");
    }
  };

  const downloadTxt = () => {
    if (generatedUserAgents.length === 0) {
      showPopupMessage("No user agents to download!", "warning");
      return;
    }

    const now = new Date();
    const timestamp = `${now.getDate().toString().padStart(2, "0")}.${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${now.getFullYear()}_${now
      .getHours()
      .toString()
      .padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}`;

    const blob = new Blob(
      [generatedUserAgents.map(ua => ua.userAgent).join("\n")],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user_agents_${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showPopupMessage("User agents downloaded as TXT file!", "success");
  };

  const downloadExcel = () => {
    if (generatedUserAgents.length === 0) {
      showPopupMessage("No user agents to download!", "warning");
      return;
    }

    const now = new Date();
    const timestamp = `${now.getDate().toString().padStart(2, "0")}.${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${now.getFullYear()}_${now
      .getHours()
      .toString()
      .padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}`;

    const ws = XLSX.utils.aoa_to_sheet([
      ["Index", "Device Type", "User Agent"],
      ...generatedUserAgents.map((ua, index) => [
        index + 1,
        ua.deviceType.toUpperCase(),
        ua.userAgent,
      ]),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "UserAgents");
    XLSX.writeFile(wb, `user_agents_${timestamp}.xlsx`);
    showPopupMessage("User agents downloaded as Excel file!", "success");
  };

  const clearAll = () => {
    setGeneratedUserAgents([]);
    setTotalAmount(100);
    setCopiedIndex(null);
    showPopupMessage("All data cleared!", "success");
  };

  const getTotalPercentage = () => {
    return deviceConfigs
      .filter(d => d.enabled)
      .reduce((sum, d) => sum + d.percentage, 0);
  };

  const getDeviceStats = () => {
    const stats = { iphone: 0, samsung: 0, motorola: 0, pixel: 0 };
    generatedUserAgents.forEach(ua => {
      stats[ua.deviceType]++;
    });
    return stats;
  };

  const getDeviceDisplayName = (type: string) => {
    switch (type) {
      case "iphone":
        return "iPhone (Facebook)";
      case "samsung":
        return "Samsung (Chrome)";
      case "motorola":
        return "Motorola (Facebook)";
      case "pixel":
        return "Google Pixel (Facebook)";
      default:
        return type;
    }
  };

  const getDeviceColor = (type: string) => {
    switch (type) {
      case "iphone":
        return "#3b82f6";
      case "samsung":
        return "#10b981";
      case "motorola":
        return "#f59e0b";
      case "pixel":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  const getDeviceEmoji = (type: string) => {
    switch (type) {
      case "iphone":
        return "📱";
      case "samsung":
        return "📱";
      case "motorola":
        return "📱";
      case "pixel":
        return "📱";
      default:
        return "📱";
    }
  };

  const canGenerate = () => {
    const enabledDevices = deviceConfigs.filter(d => d.enabled);
    const totalPercentage = enabledDevices.reduce(
      (sum, d) => sum + d.percentage,
      0
    );
    return enabledDevices.length > 0 && totalPercentage > 0;
  };

  return (
    <div className="min-h-screen p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Controls Section */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Device Configuration */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Device Selection
                </h2>
                <button
                  onClick={autoBalancePercentages}
                  className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm"
                  title="Auto-balance percentages equally"
                >
                  Auto Balance
                </button>
              </div>

              <div className="space-y-4">
                {deviceConfigs.map(config => (
                  <div key={config.type} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-700 text-sm sm:text-base">
                          {getDeviceEmoji(config.type)}{" "}
                          {getDeviceDisplayName(config.type)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={config.percentage}
                          onChange={e =>
                            updateDevicePercentage(
                              config.type,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-semibold text-gray-600">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="ml-0">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.percentage}
                        onChange={e =>
                          updateDevicePercentage(
                            config.type,
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, ${getDeviceColor(
                            config.type
                          )} 0%, ${getDeviceColor(config.type)} ${
                            config.percentage
                          }%, #e5e7eb ${config.percentage}%, #e5e7eb 100%)`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Total:
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        getTotalPercentage() === 100
                          ? "text-green-600"
                          : "text-blue-600"
                      }`}
                    >
                      {getTotalPercentage()}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Percentages will be normalized automatically
                  </p>
                </div>
              </div>
            </div>

            {/* Generation Settings */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
                Generation Settings
              </h2>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount (1-10,000)
                  </label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={e =>
                      setTotalAmount(
                        Math.max(
                          1,
                          Math.min(10000, parseInt(e.target.value) || 1)
                        )
                      )
                    }
                    min="1"
                    max="10000"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                    placeholder="Enter total amount"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !canGenerate()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <span>
                    {isGenerating ? "Generating..." : "Generate User Agents"}
                  </span>
                </button>

                {!canGenerate() && (
                  <p className="text-sm text-red-600 text-center">
                    ⚠️ Set percentages above 0 to generate
                  </p>
                )}

                {generatedUserAgents.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                    >
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Copy All</span>
                    </button>
                    <button
                      onClick={downloadTxt}
                      className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>TXT</span>
                    </button>
                    <button
                      onClick={downloadExcel}
                      className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 text-sm"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Excel</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={clearAll}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Generated User Agents
                </h2>
                <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                  {generatedUserAgents.length} UAs
                </span>
              </div>

              <div className="h-96 sm:h-[500px] overflow-y-auto bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border">
                {generatedUserAgents.length > 0 ? (
                  <div className="space-y-2">
                    {generatedUserAgents.map((ua, index) => (
                      <div
                        key={index}
                        className="p-2 sm:p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                                #{index + 1}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded font-medium`}
                                style={{
                                  backgroundColor: `${getDeviceColor(
                                    ua.deviceType
                                  )}20`,
                                  color: getDeviceColor(ua.deviceType),
                                }}
                              >
                                {getDeviceEmoji(ua.deviceType)}{" "}
                                {ua.deviceType.charAt(0).toUpperCase() +
                                  ua.deviceType.slice(1)}
                              </span>
                            </div>
                            <span className="text-gray-800 font-mono text-xs break-all block">
                              {ua.userAgent}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              copyIndividualUA(ua.userAgent, index)
                            }
                            className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                              copiedIndex === index
                                ? "bg-green-500 text-white"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                            title={`Copy user agent #${index + 1}`}
                          >
                            {copiedIndex === index ? (
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            ) : (
                              <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Smartphone className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm sm:text-base">
                        No user agents generated yet
                      </p>
                      <p className="text-xs sm:text-sm">
                        Select devices and click "Generate"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {generatedUserAgents.length > 0 && (
          <div className="mt-4 sm:mt-6 bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              Generation Statistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
                <div className="text-lg sm:text-2xl font-bold">
                  {generatedUserAgents.length}
                </div>
                <div className="text-indigo-100 text-xs sm:text-sm">
                  Total Generated
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
                <div className="text-lg sm:text-2xl font-bold">
                  {getDeviceStats().iphone}
                </div>
                <div className="text-blue-100 text-xs sm:text-sm">
                  iPhone UAs
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
                <div className="text-lg sm:text-2xl font-bold">
                  {getDeviceStats().samsung}
                </div>
                <div className="text-green-100 text-xs sm:text-sm">
                  Samsung UAs
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
                <div className="text-lg sm:text-2xl font-bold">
                  {getDeviceStats().motorola}
                </div>
                <div className="text-yellow-100 text-xs sm:text-sm">
                  Motorola UAs
                </div>
              </div>
            </div>

            {/* Second row for Pixel and additional stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
                <div className="text-lg sm:text-2xl font-bold">
                  {getDeviceStats().pixel}
                </div>
                <div className="text-purple-100 text-xs sm:text-sm">
                  Pixel UAs
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
                <div className="text-lg sm:text-2xl font-bold">
                  {deviceConfigs.filter(d => d.enabled).length}
                </div>
                <div className="text-gray-100 text-xs sm:text-sm">
                  Enabled Devices
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
                <div className="text-lg sm:text-2xl font-bold">100%</div>
                <div className="text-orange-100 text-xs sm:text-sm">Unique</div>
              </div>
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
                <div className="text-lg sm:text-2xl font-bold">
                  {getTotalPercentage()}%
                </div>
                <div className="text-pink-100 text-xs sm:text-sm">
                  Total Weight
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPopup && (
        <SecurityPopup
          show={showPopup}
          message={popupMessage}
          type={popupType}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default UserAgentGenerator;
