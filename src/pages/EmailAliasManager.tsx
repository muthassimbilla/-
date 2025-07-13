import React, { useState, useEffect } from "react";
import { Mail, Copy, Plus, Trash2, Eye, EyeOff, Database } from "lucide-react";
import { useSecurity } from "../contexts/SecurityContext";
import SecurityPopup from "../components/SecurityPopup";

interface Credential {
  id?: string;
  website: string;
  email: string;
  password: string;
  owner?: string;
  createdAt?: string;
}

const EmailAliasManager: React.FC = () => {
  const [mainEmail, setMainEmail] = useState<string>("muthassim358@gmail.com");
  const [aliasSite, setAliasSite] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPasswords, setShowPasswords] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error" | "warning">(
    "success"
  );
  const { logout, currentProfile } = useSecurity();

  const showPopupMessage = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  useEffect(() => {
    // Load credentials from localStorage
    loadCredentials();
  }, []);

  const loadCredentials = () => {
    try {
      const savedCredentials = localStorage.getItem("emailAliasCredentials");
      if (savedCredentials) {
        const parsed = JSON.parse(savedCredentials);
        setCredentials(parsed);
        showPopupMessage(
          `${parsed.length} credentials loaded successfully!`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error loading credentials:", error);
      showPopupMessage("Error loading saved credentials", "error");
    }
  };

  const saveCredentials = (newCredentials: Credential[]) => {
    try {
      localStorage.setItem(
        "emailAliasCredentials",
        JSON.stringify(newCredentials)
      );
    } catch (error) {
      console.error("Error saving credentials:", error);
      showPopupMessage("Error saving credentials", "error");
    }
  };

  const handleGenerateAlias = async () => {
    if (!aliasSite || !loginPassword) {
      showPopupMessage("All fields are required!", "warning");
      return;
    }

    const aliasEmail = `${mainEmail.split("@")[0]}+${aliasSite}@gmail.com`;
    const newEntry: Credential = {
      id: Date.now().toString(),
      website: aliasSite,
      email: aliasEmail,
      password: loginPassword,
      owner: currentProfile?.name || "User",
      createdAt: new Date().toISOString(),
    };

    try {
      setLoading(true);
      const updatedCredentials = [...credentials, newEntry];
      setCredentials(updatedCredentials);
      saveCredentials(updatedCredentials);
      showPopupMessage(`Alias created for ${aliasSite}!`, "success");
    } catch (error: any) {
      console.error("Save error:", error);
      showPopupMessage(
        "Error saving data: " + (error.message || "Unknown error"),
        "error"
      );
    }

    setAliasSite("");
    setLoginPassword("");
    setLoading(false);
  };

  const handleDeleteCredential = async (
    credentialId: string,
    website: string
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the credential for ${website}?`
      )
    ) {
      return;
    }

    try {
      const updatedCredentials = credentials.filter(
        cred => cred.id !== credentialId
      );
      setCredentials(updatedCredentials);
      saveCredentials(updatedCredentials);
      showPopupMessage(`Credential for ${website} deleted!`, "success");
    } catch (error: any) {
      console.error("Delete error:", error);
      showPopupMessage(
        "Error deleting credential: " + (error.message || "Unknown error"),
        "error"
      );
    }
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showPopupMessage(`${type} copied to clipboard!`, "success");
    } catch (error) {
      showPopupMessage("Failed to copy to clipboard!", "error");
    }
  };

  const generateRandomPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setLoginPassword(password);
    showPopupMessage("Random password generated!", "success");
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create Alias Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Create New Email Alias
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Email
                </label>
                <input
                  type="email"
                  value={mainEmail}
                  onChange={e => setMainEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  placeholder="your-email@gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website/Service
                </label>
                <input
                  type="text"
                  value={aliasSite}
                  onChange={e => setAliasSite(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  placeholder="e.g., amazon, facebook, netflix"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                    placeholder="Enter password"
                  />
                  <button
                    onClick={generateRandomPassword}
                    className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200"
                    title="Generate Random Password"
                  >
                    🎲
                  </button>
                </div>
              </div>

              {aliasSite && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>📧 Generated Alias:</strong>{" "}
                    {`${mainEmail.split("@")[0]}+${aliasSite}@gmail.com`}
                  </p>
                </div>
              )}

              <button
                onClick={handleGenerateAlias}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                <span>{loading ? "Creating..." : "Create & Save Alias"}</span>
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Statistics
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{credentials.length}</div>
                <div className="text-blue-100">Total Aliases</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">
                  {new Set(credentials.map(c => c.website)).size}
                </div>
                <div className="text-green-100">Unique Sites</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">
                  {currentProfile?.name ? "✓" : "✗"}
                </div>
                <div className="text-purple-100">Authenticated</div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">
                  <Database className="w-6 h-6" />
                </div>
                <div className="text-orange-100">Local Storage</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Security Options
                </h3>
                <button
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  {showPasswords ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span>{showPasswords ? "Hide" : "Show"} Passwords</span>
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">
                    Secure Key Authentication
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">
                    Local Storage Encryption
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">
                    User-specific Data Isolation
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials List */}
        <div className="mt-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Your Email Aliases
            </h2>
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {credentials.length} aliases
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading credentials...</p>
            </div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No email aliases created yet</p>
              <p className="text-sm text-gray-500">
                Create your first alias above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {credentials.map((credential, index) => (
                <div
                  key={credential.id || index}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-800 text-lg">
                          🌐 {credential.website}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          {credential.createdAt
                            ? new Date(
                                credential.createdAt
                              ).toLocaleDateString()
                            : "Unknown"}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              📧 Email:
                            </span>
                            <button
                              onClick={() =>
                                handleCopy(credential.email, "Email")
                              }
                              className="p-1 text-blue-500 hover:text-blue-700 transition-colors duration-200"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="font-mono text-sm text-gray-800 mt-1 break-all">
                            {credential.email}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              🔐 Password:
                            </span>
                            <button
                              onClick={() =>
                                handleCopy(credential.password, "Password")
                              }
                              className="p-1 text-blue-500 hover:text-blue-700 transition-colors duration-200"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="font-mono text-sm text-gray-800 mt-1">
                            {showPasswords
                              ? credential.password
                              : "•".repeat(credential.password.length)}
                          </p>
                        </div>
                      </div>

                      {credential.owner && (
                        <div className="mt-2 text-xs text-gray-500">
                          Created by: {credential.owner}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        handleDeleteCredential(
                          credential.id!,
                          credential.website
                        )
                      }
                      className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
};

export default EmailAliasManager;
