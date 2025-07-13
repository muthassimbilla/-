import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/SecurityContext";
import { supabase } from "../utils/supabase";

interface PhoneNumber {
  id: string;
  number: string;
  created_at: string;
}

const PhoneNumberFormatter: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [inputNumber, setInputNumber] = useState("");
  const [formattedNumber, setFormattedNumber] = useState("");
  const [warning, setWarning] = useState("");
  const [autoCopyEnabled, setAutoCopyEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<PhoneNumber[]>([]);
  const [showWarningPopup, setShowWarningPopup] = useState(false);

  useEffect(() => {
    formatPhoneNumber(inputNumber);
  }, [inputNumber]);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (warning) {
      setShowWarningPopup(true);
      const timer = setTimeout(() => {
        setShowWarningPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warning]);

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from("phone_numbers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setHistory(data);
    }
  };

  const formatPhoneNumber = async (number: string) => {
    const cleaned = number.replace(/\D/g, "");
    setFormattedNumber(cleaned);

    if (cleaned.length > 0) {
      const { data, error } = await supabase
        .from("phone_numbers")
        .select("*")
        .eq("number", cleaned)
        .single();

      if (data) {
        setWarning("This number already exists in the database!");
      } else {
        setWarning("");
      }
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputNumber(text);

      if (autoCopyEnabled && text) {
        const cleaned = text.replace(/\D/g, "");
        await navigator.clipboard.writeText(cleaned);
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const handleCopyAndSave = async () => {
    if (formattedNumber) {
      await navigator.clipboard.writeText(formattedNumber);

      if (!warning) {
        const { error } = await supabase
          .from("phone_numbers")
          .insert([{ number: formattedNumber }]);

        if (!error) {
          loadHistory();
        } else {
          console.error("Error saving number:", error);
        }
      }
    }
  };

  const copyHistoryNumber = async (number: string) => {
    await navigator.clipboard.writeText(number);
  };

  const handleClear = () => {
    setInputNumber("");
    setFormattedNumber("");
    setWarning("");
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900" : "bg-gray-100"
      } py-8 px-4`}
    >
      <div className="max-w-2xl mx-auto">
        <div
          className={`${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white"
          } rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl`}
        >
          <h1
            className={`text-4xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-800"
            } mb-8 text-center`}
          >
            Phone Number Formatter
          </h1>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-opacity-50 rounded-xl border border-opacity-20 backdrop-blur-sm">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={autoCopyEnabled}
                    onChange={e => setAutoCopyEnabled(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-6 rounded-full transition ${
                      autoCopyEnabled ? "bg-blue-600" : "bg-gray-400"
                    }`}
                  ></div>
                  <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${
                      autoCopyEnabled ? "translate-x-4" : ""
                    }`}
                  ></div>
                </div>
                <span
                  className={`${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  } group-hover:text-opacity-75`}
                >
                  Auto-copy on paste
                </span>
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleClear}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                    isDarkMode
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-red-500 hover:bg-red-600"
                  } text-white font-medium`}
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                    isDarkMode
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-500 hover:bg-blue-600"
                  } text-white font-medium`}
                >
                  {showHistory ? "Hide History" : "Show History"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Phone Number:
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputNumber}
                  onChange={e => setInputNumber(e.target.value)}
                  className={`flex-1 p-4 border rounded-xl font-medium transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-700 text-white"
                      : "border-gray-300 bg-gray-50"
                  }`}
                  placeholder="(123) 456-7890"
                />
                <button
                  onClick={handlePaste}
                  className="px-6 py-4 bg-blue-600 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Paste
                </button>
              </div>
            </div>

            {formattedNumber && (
              <div className="space-y-3">
                <label
                  className={`block text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Formatted Number:
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={formattedNumber}
                    readOnly
                    className={`flex-1 p-4 border rounded-xl font-mono text-lg transition-all duration-300 ${
                      isDarkMode
                        ? "border-gray-700 bg-gray-700 text-white"
                        : "border-gray-300 bg-gray-50"
                    }`}
                  />
                  <button
                    onClick={handleCopyAndSave}
                    className="px-6 py-4 bg-green-600 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {showHistory && (
              <div className="mt-8 space-y-4">
                <h2
                  className={`text-2xl font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Recent Numbers
                </h2>
                <div className="space-y-3">
                  {history.map(item => (
                    <div
                      key={item.id}
                      className={`flex justify-between items-center p-4 rounded-xl transition-all duration-300 transform hover:scale-102 ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <span className="font-mono text-lg">{item.number}</span>
                      <button
                        onClick={() => copyHistoryNumber(item.number)}
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning Popup */}
      {showWarningPopup && warning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-bounce-gentle max-w-md w-full mx-4 transform transition-all">
            <div className="bg-white rounded-xl shadow-2xl p-6 border-l-4 border-yellow-500">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-yellow-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-yellow-900">
                    Warning
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">{warning}</p>
                </div>
                <button
                  onClick={() => setShowWarningPopup(false)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneNumberFormatter;
