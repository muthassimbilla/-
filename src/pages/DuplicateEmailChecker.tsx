import React, { useState, useEffect } from "react";
import { Mail, Upload, Download, Trash2, Database } from "lucide-react";
import { useTheme } from "../contexts/SecurityContext";
import { useSecurity } from "../contexts/SecurityContext";
import { supabase } from "../utils/supabase";
import * as XLSX from "xlsx/xlsx.mjs";
import SecurityPopup from "../components/SecurityPopup";
import LoadingSpinner from "../components/LoadingSpinner";

const DuplicateEmailChecker: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { currentProfile, isAuthenticated } = useSecurity();
  const [inputEmails, setInputEmails] = useState<string[]>([]);
  const [uniqueEmails, setUniqueEmails] = useState<string[]>([]);
  const [duplicateEmails, setDuplicateEmails] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error" | "warning">(
    "success"
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      showPopupMessage("Please login to use this tool", "warning");
    }
  }, [isAuthenticated]);

  const showPopupMessage = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      if (file.name.endsWith(".txt")) {
        const text = await file.text();
        const emails = text
          .split(/[\n,]/)
          .map(email => email.trim())
          .filter(email => email.length > 0);
        setInputEmails(emails);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const emails = jsonData
          .flat()
          .map(cell => String(cell).trim())
          .filter(email => email.length > 0 && email.includes("@"));
        setInputEmails(emails);
      }

      showPopupMessage("File uploaded successfully!", "success");
    } catch (error) {
      console.error("Error reading file:", error);
      showPopupMessage("Error reading file. Please try again.", "error");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const checkDuplicates = async () => {
    if (!isAuthenticated || !currentProfile) {
      showPopupMessage("Please login first", "error");
      return;
    }

    if (inputEmails.length === 0) {
      showPopupMessage("Please upload emails first", "error");
      return;
    }

    setIsProcessing(true);
    try {
      // Get existing emails from database
      const { data: existingEmails, error } = await supabase
        .from("emails")
        .select("email")
        .eq("user_id", currentProfile.id)
        .in("email", inputEmails);

      if (error) throw error;

      // Create sets for faster lookup
      const existingEmailSet = new Set(
        existingEmails?.map((e: { email: string }) => e.email) || []
      );
      const uniqueEmailsArray = inputEmails.filter(
        email => !existingEmailSet.has(email)
      );
      const duplicateEmailsArray = inputEmails.filter(email =>
        existingEmailSet.has(email)
      );

      setUniqueEmails(uniqueEmailsArray);
      setDuplicateEmails(duplicateEmailsArray);

      showPopupMessage(
        `Found ${uniqueEmailsArray.length} new emails and ${duplicateEmailsArray.length} duplicates`,
        "success"
      );
    } catch (error) {
      console.error("Error checking duplicates:", error);
      showPopupMessage("Error checking duplicates. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToDatabase = async () => {
    if (!isAuthenticated || !currentProfile) {
      showPopupMessage("Please login first", "error");
      return;
    }

    if (uniqueEmails.length === 0) {
      showPopupMessage("No new emails to save", "warning");
      return;
    }

    setIsProcessing(true);
    try {
      const emailsToInsert = uniqueEmails.map(email => ({
        email,
        user_id: currentProfile.id,
      }));

      const { error } = await supabase
        .from("emails")
        .insert(emailsToInsert)
        .select();

      if (error) throw error;

      showPopupMessage(
        `Successfully saved ${uniqueEmails.length} new emails to database`,
        "success"
      );
      setUniqueEmails([]);
      setInputEmails([]);
    } catch (error) {
      console.error("Error saving to database:", error);
      showPopupMessage("Error saving to database. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResults = (type: "unique" | "duplicate") => {
    const emails = type === "unique" ? uniqueEmails : duplicateEmails;
    if (emails.length === 0) {
      showPopupMessage(`No ${type} emails to download`, "warning");
      return;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Email"],
      ...emails.map(email => [email]),
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Emails");

    // Download file
    XLSX.writeFile(wb, `${type}-emails.xlsx`);
    showPopupMessage(`${type} emails downloaded successfully!`, "success");
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      } py-8 px-4`}
    >
      <div className="max-w-6xl mx-auto">
        <div
          className={`${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-2xl shadow-xl p-8`}
        >
          <h1 className="text-4xl font-bold mb-8 text-center">
            Duplicate Email Checker
          </h1>

          <div className="space-y-8">
            {/* Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Upload Emails</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2
                      ${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white`}
                    disabled={isProcessing}
                  >
                    <Upload size={20} />
                    Upload File
                  </button>
                  <button
                    onClick={checkDuplicates}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2
                      ${
                        isDarkMode
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-green-500 hover:bg-green-600"
                      } text-white`}
                    disabled={isProcessing || inputEmails.length === 0}
                  >
                    <Database size={20} />
                    Check Duplicates
                  </button>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.xlsx,.xls"
                className="hidden"
              />

              {/* Input Emails Display */}
              <div
                className={`${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                } rounded-xl p-4 h-[200px] overflow-y-auto`}
              >
                {inputEmails.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">
                        Uploaded Emails: {inputEmails.length}
                      </span>
                      <button
                        onClick={() => setInputEmails([])}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    {inputEmails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="font-mono">{email}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Mail size={48} className="mb-3 opacity-30" />
                    <p className="text-center font-medium">
                      No emails uploaded yet
                    </p>
                    <p className="text-sm opacity-75 mt-1">
                      Upload a .txt or .xlsx file to begin
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Results Section */}
            {(uniqueEmails.length > 0 || duplicateEmails.length > 0) && (
              <div className="grid grid-cols-2 gap-8">
                {/* Unique Emails */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">
                      New Emails ({uniqueEmails.length})
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadResults("unique")}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        }`}
                        title="Download Unique Emails"
                      >
                        <Download size={20} className="text-green-500" />
                      </button>
                      <button
                        onClick={saveToDatabase}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300
                          ${
                            isDarkMode
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-green-500 hover:bg-green-600"
                          } text-white`}
                        disabled={isProcessing || uniqueEmails.length === 0}
                      >
                        Save to Database
                      </button>
                    </div>
                  </div>
                  <div
                    className={`${
                      isDarkMode ? "bg-gray-700" : "bg-gray-50"
                    } rounded-xl p-4 h-[300px] overflow-y-auto`}
                  >
                    {uniqueEmails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2 py-1">
                        <Mail size={16} className="text-green-500" />
                        <span className="font-mono">{email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Duplicate Emails */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">
                      Duplicate Emails ({duplicateEmails.length})
                    </h3>
                    <button
                      onClick={() => downloadResults("duplicate")}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                      title="Download Duplicate Emails"
                    >
                      <Download size={20} className="text-red-500" />
                    </button>
                  </div>
                  <div
                    className={`${
                      isDarkMode ? "bg-gray-700" : "bg-gray-50"
                    } rounded-xl p-4 h-[300px] overflow-y-auto`}
                  >
                    {duplicateEmails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2 py-1">
                        <Mail size={16} className="text-red-500" />
                        <span className="font-mono">{email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}

      {/* Popup */}
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

export default DuplicateEmailChecker;
