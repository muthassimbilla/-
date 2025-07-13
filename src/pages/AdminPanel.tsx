import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Shield,
  Key,
  Copy,
  Eye,
  EyeOff,
  Users,
  Monitor,
  Calendar,
  Clock,
  Smartphone,
} from "lucide-react";
import { useSecurity } from "../contexts/SecurityContext";
import SecurityPopup from "../components/SecurityPopup";
import { formatLocation } from "../utils/location";

const AdminPanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error" | "warning">(
    "success"
  );
  const [isUnlimitedValidity, setIsUnlimitedValidity] = useState(false);

  const { apiKeys, addApiKey, removeApiKey, getDeviceFingerprint } =
    useSecurity();

  const ADMIN_PASSWORD = "adminbilla";

  useEffect(() => {
    // Check if we're on the correct admin path
    if (location.pathname !== "/admin/billa") {
      navigate("/admin/billa");
    }
  }, [location, navigate]);

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

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Adding key with values:", {
      newApiKey,
      newKeyName,
      newKeyExpiry,
      isUnlimitedValidity,
    });

    if (!newApiKey.trim()) {
      showPopupMessage("Please enter a valid API key!", "warning");
      return;
    }

    if (!newKeyName.trim()) {
      showPopupMessage("Please enter a key name!", "warning");
      return;
    }

    if (!isUnlimitedValidity && !newKeyExpiry) {
      showPopupMessage(
        "Please select an expiry date or choose unlimited validity!",
        "warning"
      );
      return;
    }

    if (apiKeys.some(key => key.key === newApiKey)) {
      showPopupMessage("This API key already exists!", "error");
      return;
    }

    try {
      if (!isUnlimitedValidity) {
        const expiryDate = new Date(newKeyExpiry);
        if (expiryDate <= new Date()) {
          showPopupMessage("Expiry date must be in the future!", "error");
          return;
        }

        console.log("Adding key with expiry:", expiryDate.toISOString());
        await addApiKey(newApiKey, newKeyName, expiryDate.toISOString());
      } else {
        // Pass null for unlimited validity
        console.log("Adding key with unlimited validity (null expiry)");
        await addApiKey(newApiKey, newKeyName, null);
      }

      setNewApiKey("");
      setNewKeyName("");
      setNewKeyExpiry("");
      setIsUnlimitedValidity(false);
      showPopupMessage("API key added successfully!", "success");
    } catch (error) {
      console.error("Error adding API key:", error);
      showPopupMessage(
        "Failed to add API key. Check console for details.",
        "error"
      );
    }
  };

  const handleRemoveApiKey = (id: string) => {
    if (window.confirm("Are you sure you want to remove this API key?")) {
      removeApiKey(id);
      showPopupMessage("API key removed successfully!", "success");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showPopupMessage("Copied to clipboard!", "success");
    } catch (err) {
      showPopupMessage("Failed to copy!", "error");
    }
  };

  const generateRandomKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `KEY-${result}`;
  };

  const isKeyExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false; // Unlimited validity, never expires
    return new Date() > new Date(expiresAt);
  };

  const getDaysUntilExpiry = (expiresAt: string | null): number => {
    if (!expiresAt) return Infinity; // Unlimited validity
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8">
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-red-500 mb-2">
                Admin Panel
              </h1>
              <p className="text-gray-600">Restricted Access Area</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter admin password"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-200"
              >
                <Shield className="w-5 h-5" />
                Access Admin Panel
              </button>
            </form>
          </div>
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-purple-600 p-8">
      <div className="max-w-7xl mx-auto">
        {showPopup && (
          <SecurityPopup
            show={showPopup}
            message={popupMessage}
            type={popupType}
            onClose={() => setShowPopup(false)}
          />
        )}

        {/* Header with Navigation */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Admin Control Panel
                </h1>
                <p className="text-gray-600">
                  Manage API keys and system security
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/admin/ua")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                <Smartphone className="w-5 h-5" />
                User Agent Config
              </button>
              <button
                onClick={() => setShowPasswords(!showPasswords)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                {showPasswords ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
                {showPasswords ? "Hide Keys" : "Show Keys"}
              </button>
            </div>
          </div>
        </div>

        {/* Main API Management Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              API Key Management
            </h2>
          </div>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{apiKeys.length}</div>
                  <div className="text-blue-100">Total Keys</div>
                </div>
                <Key className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    {
                      apiKeys.filter(
                        k => k.isActive && !isKeyExpired(k.expiresAt)
                      ).length
                    }
                  </div>
                  <div className="text-green-100">Active Keys</div>
                </div>
                <Users className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    {apiKeys.filter(k => k.deviceId).length}
                  </div>
                  <div className="text-purple-100">Bound Devices</div>
                </div>
                <Monitor className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    {apiKeys.filter(k => isKeyExpired(k.expiresAt)).length}
                  </div>
                  <div className="text-red-100">Expired Keys</div>
                </div>
                <Clock className="w-8 h-8 text-red-200" />
              </div>
            </div>
          </div>

          {/* Add New API Key */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Add New API Key
            </h2>
            <form onSubmit={handleAddApiKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newApiKey}
                    onChange={e => setNewApiKey(e.target.value)}
                    placeholder="Enter API key or generate one"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNewApiKey(generateRandomKey())}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="Enter a name for this key"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="unlimitedValidity"
                  checked={isUnlimitedValidity}
                  onChange={e => {
                    console.log(
                      "Unlimited validity checkbox changed:",
                      e.target.checked
                    );
                    setIsUnlimitedValidity(e.target.checked);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="unlimitedValidity"
                  className="text-sm font-medium text-gray-700"
                >
                  Unlimited Validity (Never Expires)
                </label>
              </div>

              {!isUnlimitedValidity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newKeyExpiry}
                    onChange={e => setNewKeyExpiry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Add API Key
              </button>
            </form>
          </div>

          {/* API Keys List */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              API Keys Management
            </h2>
            <div className="space-y-4">
              {apiKeys.map(apiKey => {
                const expired = isKeyExpired(apiKey.expiresAt);
                const daysLeft = getDaysUntilExpiry(apiKey.expiresAt);

                return (
                  <div
                    key={apiKey.id}
                    className={`rounded-xl p-4 border hover:shadow-md transition-shadow duration-200 ${
                      expired
                        ? "bg-red-50 border-red-200"
                        : daysLeft <= 7
                        ? "bg-orange-50 border-orange-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="font-mono text-lg font-semibold text-gray-800">
                            {showPasswords
                              ? apiKey.key
                              : "•".repeat(apiKey.key.length)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(apiKey.key)}
                            className="p-1 text-blue-500 hover:text-blue-700 transition-colors duration-200"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              expired
                                ? "bg-red-100 text-red-800"
                                : daysLeft <= 7
                                ? "bg-orange-100 text-orange-800"
                                : apiKey.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {expired
                              ? "Expired"
                              : daysLeft <= 7
                              ? `${daysLeft} days left`
                              : apiKey.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="bg-white rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-blue-800">
                                User
                              </span>
                            </div>
                            <p className="text-gray-700 font-semibold">
                              {apiKey.name}
                            </p>
                          </div>

                          <div className="bg-white rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Calendar className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-800">
                                Created
                              </span>
                            </div>
                            <p className="text-gray-700">
                              {new Date(apiKey.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="bg-white rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Clock
                                className={`w-4 h-4 ${
                                  expired
                                    ? "text-red-600"
                                    : daysLeft <= 7
                                    ? "text-orange-600"
                                    : "text-blue-600"
                                }`}
                              />
                              <span
                                className={`font-medium ${
                                  expired
                                    ? "text-red-800"
                                    : daysLeft <= 7
                                    ? "text-orange-800"
                                    : "text-blue-800"
                                }`}
                              >
                                Expires
                              </span>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">
                                Expires
                              </div>
                              <div className="text-sm">
                                {apiKey.expiresAt
                                  ? new Date(
                                      apiKey.expiresAt
                                    ).toLocaleDateString()
                                  : "Unlimited"}
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Monitor className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-purple-800">
                                Location
                              </span>
                            </div>
                            <p className="text-gray-700 text-xs">
                              {formatLocation(apiKey.deviceLocation)}
                            </p>
                            {apiKey.deviceId && (
                              <p className="text-green-600 text-xs mt-1">
                                Device Bound
                              </p>
                            )}
                          </div>
                        </div>

                        {apiKey.lastUsed && (
                          <div className="mt-2 text-xs text-gray-500">
                            Last used:{" "}
                            {new Date(apiKey.lastUsed).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleRemoveApiKey(apiKey.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Information */}
          <div className="mt-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              System Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Current Device Fingerprint
                </h3>
                <p className="font-mono text-sm text-gray-600 break-all">
                  {getDeviceFingerprint()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Security Status
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-green-600">
                    ✓ Right-click protection enabled
                  </p>
                  <p className="text-green-600">✓ Developer tools blocked</p>
                  <p className="text-green-600">
                    ✓ Device fingerprinting active
                  </p>
                  <p className="text-green-600">
                    ✓ Content Security Policy enforced
                  </p>
                  <p className="text-green-600">
                    ✓ Key expiration monitoring active
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
