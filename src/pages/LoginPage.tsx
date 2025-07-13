import React, { useState } from "react";
import { Key, Lock, AlertTriangle } from "lucide-react";
import { useSecurity } from "../contexts/SecurityContext";
import { useTheme } from "../contexts/SecurityContext";
import SecurityPopup from "../components/SecurityPopup";
import ProLogo from "../components/ProLogo";
import LoadingSpinner from "../components/LoadingSpinner";

const LoginPage: React.FC = () => {
  const [accessKey, setAccessKey] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<"success" | "error" | "warning">(
    "success"
  );
  const [popupMessage, setPopupMessage] = useState("");
  const { login, isLoading } = useSecurity();
  const { isDarkMode } = useTheme();

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-900 to-gray-800"
            : "bg-pro-gradient"
        }`}
      >
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p
            className={`text-lg ${isDarkMode ? "text-white" : "text-gray-800"}`}
          >
            Initializing B Tools...
          </p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessKey.trim()) {
      showPopupMessage("Please enter an access key!", "warning");
      return;
    }

    const success = await login(accessKey);
    if (success) {
      showPopupMessage("Login Successful! Welcome to B Tools!", "success");
      setTimeout(() => {
        setShowPopup(false);
      }, 2000);
    } else {
      showPopupMessage("Invalid Access Key! Please try again.", "error");
      setAccessKey("");
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

  const handleNeedKey = () => {
    showPopupMessage("Redirecting to Telegram for access key...", "success");
    setTimeout(() => {
      window.open("https://t.me/muthassimbilla", "_blank");
      setShowPopup(false);
    }, 1500);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-pro-gradient"
      }`}
    >
      <div className="max-w-md w-full">
        {/* Main Login Card */}
        <div
          className={`${
            isDarkMode
              ? "bg-slate-800/80 border-slate-700/20"
              : "bg-white/80 border-white/20"
          } backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 border`}
        >
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4">
              <ProLogo size="lg" variant={isDarkMode ? "light" : "dark"} />
            </div>
            <p
              className={`${
                isDarkMode ? "text-slate-300" : "text-gray-600"
              } mt-2 text-sm sm:text-base`}
            >
              Professional Development Utilities
            </p>
            <p
              className={`text-xs sm:text-sm ${
                isDarkMode ? "text-slate-400" : "text-gray-500"
              } mt-1`}
            >
              Enter your access key to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    isDarkMode ? "text-slate-400" : "text-gray-400"
                  }`}
                />
              </div>
              <input
                type="password"
                value={accessKey}
                onChange={e => setAccessKey(e.target.value)}
                className={`block w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-3 ${
                  isDarkMode
                    ? "border-slate-600 bg-slate-700/50 text-white focus:ring-pro-purple-400"
                    : "border-gray-300 bg-white/50 text-gray-900 focus:ring-pro-purple-500"
                } rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-sm sm:text-base`}
                placeholder="Enter your access key"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center px-4 py-2 sm:py-3 bg-gradient-to-r from-pro-purple-500 to-pro-purple-700 text-white font-semibold rounded-lg sm:rounded-xl hover:from-pro-purple-600 hover:to-pro-purple-800 focus:outline-none focus:ring-2 focus:ring-pro-purple-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg text-sm sm:text-base ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              )}
              {isLoading ? "Accessing..." : "Access B Tools"}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <button
              onClick={handleNeedKey}
              className="text-pro-purple-400 hover:text-pro-purple-300 font-medium transition-colors duration-200 flex items-center justify-center mx-auto text-sm sm:text-base"
            >
              <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Need an access key?
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div
          className={`mt-4 sm:mt-6 ${
            isDarkMode
              ? "bg-slate-800/60 border-slate-700/20"
              : "bg-white/60 border-white/20"
          } backdrop-blur-lg rounded-lg sm:rounded-xl p-4 sm:p-6 border`}
        >
          <h3
            className={`text-base sm:text-lg font-semibold ${
              isDarkMode ? "text-white" : "text-gray-800"
            } mb-3 sm:mb-4 text-center`}
          >
            Available Tools
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-pro-purple-500 rounded-full flex-shrink-0"></div>
              <span
                className={`${isDarkMode ? "text-slate-300" : "text-gray-700"}`}
              >
                Email Extractor
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-pro-purple-600 rounded-full flex-shrink-0"></div>
              <span
                className={`${isDarkMode ? "text-slate-300" : "text-gray-700"}`}
              >
                Duplicate Remover
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-pro-purple-400 rounded-full flex-shrink-0"></div>
              <span
                className={`${isDarkMode ? "text-slate-300" : "text-gray-700"}`}
              >
                User Agent Mixer
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-pro-purple-700 rounded-full flex-shrink-0"></div>
              <span
                className={`${isDarkMode ? "text-slate-300" : "text-gray-700"}`}
              >
                UA Generator
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-pro-purple-300 rounded-full flex-shrink-0"></div>
              <span
                className={`${isDarkMode ? "text-slate-300" : "text-gray-700"}`}
              >
                Text Formatter
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-pro-purple-800 rounded-full flex-shrink-0"></div>
              <span
                className={`${isDarkMode ? "text-slate-300" : "text-gray-700"}`}
              >
                Password Generator
              </span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div
          className={`mt-4 sm:mt-6 ${
            isDarkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-pro-purple-50 border-pro-purple-200"
          } rounded-lg sm:rounded-xl p-3 sm:p-4 border`}
        >
          <div className="flex items-start">
            <AlertTriangle
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                isDarkMode ? "text-pro-purple-400" : "text-pro-purple-600"
              } mt-0.5 mr-2 flex-shrink-0`}
            />
            <div
              className={`text-xs sm:text-sm ${
                isDarkMode ? "text-slate-300" : "text-pro-purple-800"
              }`}
            >
              <p className="font-semibold mb-1">Security Notice:</p>
              <p>
                This application is protected by advanced security measures.
                Unauthorized access attempts are monitored.
              </p>
            </div>
          </div>
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

export default LoginPage;
