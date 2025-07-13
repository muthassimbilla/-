import React, { useState, useCallback, useRef } from "react";
import { Mail, Copy, Download, Trash2, Upload } from "lucide-react";
import { useSecurity } from "../contexts/SecurityContext";
import * as XLSX from "xlsx/xlsx.mjs";
import SecurityPopup from "../components/SecurityPopup";
import LoadingSpinner from "../components/LoadingSpinner";

const EmailExtractor: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [extractedEmails, setExtractedEmails] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error" | "warning">(
    "success"
  );
  const [autoExtract, setAutoExtract] = useState(true);
  const [autoCopy, setAutoCopy] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { logout } = useSecurity();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showPopupMessage = useCallback(
    (message: string, type: "success" | "error" | "warning") => {
      setPopupMessage(message);
      setPopupType(type);
      setShowPopup(true);
    },
    []
  );

  // Improved email validation
  const isValidEmail = (email: string): boolean => {
    // Basic structure check
    const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!basicRegex.test(email)) return false;

    // Additional validation rules
    const parts = email.split("@");
    const local = parts[0];
    const domain = parts[1];

    // Local part checks
    if (local.length > 64) return false;
    if (local.startsWith(".") || local.endsWith(".")) return false;
    if (local.includes("..")) return false;

    // Domain part checks
    if (domain.startsWith("-") || domain.endsWith("-")) return false;
    if (domain.includes("..")) return false;

    const domainParts = domain.split(".");
    if (domainParts.some(part => part.length > 63)) return false;

    return true;
  };

  // Improved email extraction
  const extractEmailsFromText = useCallback(
    async (text: string, shouldAutoCopy: boolean = false) => {
      setIsProcessing(true);
      try {
        // First pass: find potential email-like strings
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const potentialEmails = text.match(emailRegex) || [];

        // Second pass: validate each email
        const validEmails = potentialEmails
          .filter(isValidEmail)
          .map(email => email.toLowerCase());

        // Remove duplicates
        const uniqueEmails = [...new Set(validEmails)];
        setExtractedEmails(uniqueEmails);

        if (uniqueEmails.length > 0) {
          if (shouldAutoCopy && autoCopy) {
            try {
              await navigator.clipboard.writeText(uniqueEmails.join("\n"));
              showPopupMessage(
                `Extracted ${uniqueEmails.length} emails and copied to clipboard!`,
                "success"
              );
            } catch (err) {
              showPopupMessage(
                `Extracted ${uniqueEmails.length} emails (copy failed)`,
                "warning"
              );
            }
          } else {
            showPopupMessage(
              `Extracted ${uniqueEmails.length} unique emails!`,
              "success"
            );
          }
        } else {
          showPopupMessage("No valid emails found in the text.", "warning");
        }
      } catch (error) {
        showPopupMessage("Error processing text. Please try again.", "error");
      } finally {
        setIsProcessing(false);
      }
    },
    [showPopupMessage, autoCopy]
  );

  // Improved Excel processing
  const processExcelFile = async (data: ArrayBuffer) => {
    try {
      const workbook = XLSX.read(data, { type: "array" });
      let allText = "";

      // Process all sheets
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Process each cell and extract text
        jsonData.forEach((row: any) => {
          if (Array.isArray(row)) {
            row.forEach(cell => {
              if (cell) allText += String(cell) + " ";
            });
          }
        });
      }

      setInputText(allText);
      showPopupMessage("Excel file processed successfully!", "success");

      if (autoExtract) {
        await extractEmailsFromText(allText, true);
      }
    } catch (error) {
      showPopupMessage("Failed to process Excel file", "error");
    }
  };

  // Improved file upload handling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".txt")) {
        const text = await file.text();
        setInputText(text);
        showPopupMessage("TXT file uploaded successfully!", "success");

        if (autoExtract) {
          await extractEmailsFromText(text, true);
        }
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        await processExcelFile(buffer);
      } else {
        showPopupMessage(
          "Unsupported file type. Only TXT and Excel files are allowed.",
          "error"
        );
      }
    } catch (error) {
      showPopupMessage("Error processing file. Please try again.", "error");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const copyToClipboard = async () => {
    if (extractedEmails.length === 0) {
      showPopupMessage("No emails to copy!", "warning");
      return;
    }

    try {
      await navigator.clipboard.writeText(extractedEmails.join("\n"));
      showPopupMessage("Emails copied to clipboard!", "success");
    } catch (err) {
      showPopupMessage("Failed to copy emails!", "error");
    }
  };

  const downloadTxt = () => {
    if (extractedEmails.length === 0) {
      showPopupMessage("No emails to download!", "warning");
      return;
    }

    const blob = new Blob([extractedEmails.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extracted_emails.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showPopupMessage("Emails downloaded as TXT file!", "success");
  };

  const downloadExcel = () => {
    if (extractedEmails.length === 0) {
      showPopupMessage("No emails to download!", "warning");
      return;
    }

    const ws = XLSX.utils.aoa_to_sheet([
      ["Email"],
      ...extractedEmails.map(email => [email]),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Emails");
    XLSX.writeFile(wb, "extracted_emails.xlsx");
    showPopupMessage("Emails downloaded as Excel file!", "success");
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      showPopupMessage("Text pasted from clipboard!", "success");

      // ✅ Auto Extract + Auto Copy
      if (autoExtract) {
        await extractEmailsFromText(text, true); // Enable auto-copy for paste action
      }
    } catch (err) {
      showPopupMessage("Failed to paste from clipboard!", "error");
    }
  };

  const clearAll = () => {
    setInputText("");
    setExtractedEmails([]);
    showPopupMessage("All data cleared!", "success");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-500/30 to-purple-400/10 py-8 px-4">
      <div className="container mx-auto max-w-6xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Input Text
                </h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={e => setAutoExtract(!autoExtract)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 ${
                      autoExtract
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {autoExtract ? "✓" : "×"} Auto Extract
                  </button>
                  <button
                    onClick={e => setAutoCopy(!autoCopy)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 ${
                      autoCopy
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {autoCopy ? "✓" : "×"} Auto Copy
                  </button>
                  <button
                    onClick={pasteFromClipboard}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 flex items-center gap-2"
                    disabled={isProcessing}
                  >
                    <Copy size={16} />
                    Paste
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={e => {
                    setInputText(e.target.value);
                    if (autoExtract) {
                      extractEmailsFromText(e.target.value, true);
                    }
                  }}
                  placeholder="Paste your text containing email addresses here..."
                  className="w-full h-[350px] p-4 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-700/50 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  disabled={isProcessing}
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                    <LoadingSpinner size="lg" />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => extractEmailsFromText(inputText)}
                  className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 flex items-center gap-2 flex-1"
                  disabled={isProcessing || !inputText}
                >
                  <Mail size={18} />
                  Extract Emails
                </button>
                <button
                  onClick={clearAll}
                  className="px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-200 flex items-center gap-2"
                  disabled={isProcessing || !inputText}
                >
                  <Trash2 size={18} />
                  Clear All
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-200 flex items-center gap-2"
                  disabled={isProcessing}
                >
                  <Upload size={18} />
                  Upload File
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                Extracted Emails ({extractedEmails.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 flex items-center gap-2"
                  disabled={isProcessing || extractedEmails.length === 0}
                >
                  <Copy size={16} />
                  Copy
                </button>
                <button
                  onClick={downloadTxt}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-200 flex items-center gap-2"
                  disabled={isProcessing || extractedEmails.length === 0}
                >
                  <Download size={16} />
                  TXT
                </button>
                <button
                  onClick={downloadExcel}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 flex items-center gap-2"
                  disabled={isProcessing || extractedEmails.length === 0}
                >
                  <Download size={16} />
                  Excel
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl h-[400px] overflow-y-auto">
              {extractedEmails.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {extractedEmails.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-gray-700 group transition-colors duration-150"
                    >
                      <Mail
                        size={16}
                        className="text-gray-400 dark:text-gray-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium flex-1">
                        {email}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(email);
                          showPopupMessage(
                            "Email copied to clipboard!",
                            "success"
                          );
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <Copy
                          size={14}
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-6">
                  <Mail size={48} className="mb-3 opacity-30" />
                  <p className="text-center font-medium">
                    No emails extracted yet
                  </p>
                  <p className="text-sm opacity-75 mt-1">
                    Paste text and click "Extract Emails"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".txt,.xlsx,.xls"
        className="hidden"
      />

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

export default EmailExtractor;
