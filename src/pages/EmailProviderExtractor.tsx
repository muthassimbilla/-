import React, { useState, useCallback, useRef, useMemo } from "react";
import { Mail, Copy, Download, Trash2, Upload, Users, Filter, AtSign } from "lucide-react";
import { useSecurity } from "../contexts/SecurityContext";
import { useTheme } from "../contexts/SecurityContext";
import SecurityPopup from "../components/SecurityPopup";
import LoadingSpinner from "../components/LoadingSpinner";
import * as XLSX from "xlsx/xlsx.mjs";
import { createEmailWorker } from "../utils/emailWorker";

const EmailProviderExtractor: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [inputText, setInputText] = useState("");
  const [extractedEmails, setExtractedEmails] = useState({
    gmail: [],
    yahoo: [],
    hotmail: [],
    outlook: [],
    others: []
  });
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error" | "warning">("success");
  const [autoExtract, setAutoExtract] = useState(true);
  const [autoCopy, setAutoCopy] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [processedCount, setProcessedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const providers = {
    gmail: { name: "Gmail", domains: ["gmail.com", "googlemail.com"], color: "bg-red-500", icon: "📧" },
    yahoo: { name: "Yahoo", domains: ["yahoo.com", "yahoo.in", "yahoo.co.in", "ymail.com"], color: "bg-purple-500", icon: "📨" },
    hotmail: { name: "Hotmail", domains: ["hotmail.com", "hotmail.co.uk", "hotmail.in", "live.com"], color: "bg-blue-500", icon: "📩" },
    outlook: { name: "Outlook", domains: ["outlook.com", "outlook.in", "msn.com"], color: "bg-indigo-500", icon: "💌" },
    others: { name: "Others", domains: [], color: "bg-gray-500", icon: "📮" }
  };

  const showPopupMessage = useCallback((message: string, type: "success" | "error" | "warning") => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  }, []);

  // Cleanup worker on unmount
  React.useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const isValidEmail = (email: string): boolean => {
    const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!basicRegex.test(email)) return false;

    const parts = email.split("@");
    const local = parts[0];
    const domain = parts[1];

    if (local.length > 64) return false;
    if (local.startsWith(".") || local.endsWith(".")) return false;
    if (local.includes("..")) return false;
    if (domain.startsWith("-") || domain.endsWith("-")) return false;
    if (domain.includes("..")) return false;

    const domainParts = domain.split(".");
    if (domainParts.some(part => part.length > 63)) return false;

    return true;
  };

  const categorizeEmail = (email: string): string => {
    const domain = email.split("@")[1].toLowerCase();
    
    for (const [provider, config] of Object.entries(providers)) {
      if (provider !== "others" && config.domains.includes(domain)) {
        return provider;
      }
    }
    return "others";
  };

  // Enhanced email extraction with Web Workers for large datasets
  const extractEmailsFromText = useCallback(async (text: string, shouldAutoCopy = false) => {
    if (!text.trim()) {
      showPopupMessage("No text to process.", "warning");
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus("Initializing...");
    setProcessedCount(0);
    
    try {
      // For small texts, use synchronous processing with smaller threshold
      if (text.length < 50000) { // Less than 50KB
        setProcessingStatus("Processing small dataset...");
        await processSmallDataset(text, shouldAutoCopy);
        return;
      }

      // For large texts, use Web Worker
      setProcessingStatus("Processing large dataset with Web Worker...");
      await processLargeDataset(text, shouldAutoCopy);

    } catch (error) {
      console.error("Error processing text:", error);
      showPopupMessage("Error processing text. Please try again.", "error");
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStatus("");
      setProcessedCount(0);
    }
  }, [showPopupMessage, autoCopy]);

  const processSmallDataset = async (text: string, shouldAutoCopy: boolean) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const potentialEmails = text.match(emailRegex) || [];
    
    if (potentialEmails.length === 0) {
      showPopupMessage("No email patterns found in the text.", "warning");
      return;
    }

    const categorizedEmails = {
      gmail: [],
      yahoo: [],
      hotmail: [],
      outlook: [],
      others: []
    };

    const processedEmails = new Set<string>();

    // Process in smaller chunks to maintain responsiveness
    const CHUNK_SIZE = 100;
    for (let i = 0; i < potentialEmails.length; i += CHUNK_SIZE) {
      const chunk = potentialEmails.slice(i, i + CHUNK_SIZE);
      
      // Yield control to prevent blocking - use longer delay for better responsiveness
      await new Promise(resolve => setTimeout(resolve, 10));
      
      chunk.forEach(email => {
        const cleanEmail = email.toLowerCase();
        
        if (processedEmails.has(cleanEmail) || !isValidEmail(cleanEmail)) {
          return;
        }
        
        processedEmails.add(cleanEmail);
        const category = categorizeEmail(cleanEmail);
        categorizedEmails[category].push(cleanEmail);
      });

      setProcessingProgress(Math.round(((i + CHUNK_SIZE) / potentialEmails.length) * 100));
      setProcessedCount(processedEmails.size);
      
      // Additional yield for very large datasets
      if (i > 0 && i % 1000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    setExtractedEmails(categorizedEmails);
    await handleExtractionComplete(categorizedEmails, shouldAutoCopy);
  };

  const processLargeDataset = async (text: string, shouldAutoCopy: boolean) => {
    return new Promise((resolve, reject) => {
      // Terminate existing worker if any
      if (workerRef.current) {
        workerRef.current.terminate();
      }

      // Create new worker
      workerRef.current = createEmailWorker();

      workerRef.current.onmessage = async (e) => {
        const { type, progress, result, totalProcessed, processed, error } = e.data;

        switch (type) {
          case 'progress':
            setProcessingProgress(progress);
            setProcessedCount(processed);
            setProcessingStatus(`Processing... ${processed} emails found`);
            break;

          case 'complete':
            setExtractedEmails(result);
            await handleExtractionComplete(result, shouldAutoCopy);
            workerRef.current?.terminate();
            workerRef.current = null;
            resolve(result);
            break;

          case 'error':
            showPopupMessage(`Processing error: ${error}`, "error");
            workerRef.current?.terminate();
            workerRef.current = null;
            reject(new Error(error));
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        showPopupMessage("Worker error occurred", "error");
        workerRef.current?.terminate();
        workerRef.current = null;
        reject(error);
      };

      // Start processing
      workerRef.current.postMessage({ 
        text, 
        chunkSize: 10000 // Larger chunks for better performance
      });
    });
  };

  const handleExtractionComplete = async (categorizedEmails: any, shouldAutoCopy: boolean) => {
    const totalEmails = Object.values(categorizedEmails).flat().length;
    
    if (totalEmails > 0) {
      const breakdown = Object.entries(categorizedEmails)
        .filter(([_, emails]) => emails.length > 0)
        .map(([provider, emails]) => `${providers[provider].name}: ${emails.length}`)
        .join(", ");

      if (shouldAutoCopy && autoCopy) {
        try {
          const allEmails = Object.values(categorizedEmails).flat();
          await navigator.clipboard.writeText(allEmails.join("\n"));
          showPopupMessage(`Extracted ${totalEmails} emails (${breakdown}) and copied to clipboard!`, "success");
        } catch (err) {
          showPopupMessage(`Extracted ${totalEmails} emails (${breakdown}) - copy failed`, "warning");
        }
      } else {
        showPopupMessage(`Extracted ${totalEmails} emails - ${breakdown}`, "success");
      }
    } else {
      showPopupMessage("No valid emails found in the text.", "warning");
    }
  };

  // Enhanced Excel processing with streaming and progress
  const processExcelFile = async (data: ArrayBuffer) => {
    try {
      setIsProcessing(true);
      setProcessingProgress(10);
      setProcessingStatus("Reading Excel file...");
      
      // Use streaming approach for large Excel files
      const workbook = XLSX.read(data, { 
        type: "array",
        cellText: false,
        cellDates: false
      });
      
      setProcessingProgress(30);
      setProcessingStatus("Extracting text from sheets...");

      let allText = "";
      const totalSheets = workbook.SheetNames.length;

      // Process sheets one by one
      for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
        const sheetName = workbook.SheetNames[sheetIndex];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON in chunks to prevent memory issues
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: "",
          raw: false
        });

        // Process rows in batches
        const BATCH_SIZE = 1000;
        for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
          const batch = jsonData.slice(i, i + BATCH_SIZE);
          
          batch.forEach((row: any) => {
            if (Array.isArray(row)) {
              row.forEach(cell => {
                if (cell && typeof cell === 'string') {
                  allText += cell + " ";
                }
              });
            // Yield control and update progress with longer delay
            await new Promise(resolve => setTimeout(resolve, 20));

          // Yield control and update progress
          await new Promise(resolve => setTimeout(resolve, 0));
          
          const sheetProgress = (i + BATCH_SIZE) / jsonData.length;
          const totalProgress = 30 + ((sheetIndex + sheetProgress) / totalSheets) * 40;
          setProcessingProgress(Math.min(Math.round(totalProgress), 70));
          
          // Additional yield between sheets
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setProcessingStatus(`Processed sheet ${sheetIndex + 1}/${totalSheets}`);
      }

      setProcessingProgress(70);
      setInputText(allText);
      showPopupMessage("Excel file processed successfully!", "success");

      if (autoExtract) {
        setProcessingStatus("Extracting emails...");
        await extractEmailsFromText(allText, true);
      }
    } catch (error) {
      console.error("Excel processing error:", error);
      showPopupMessage("Failed to process Excel file. File may be too large or corrupted.", "error");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Increased file size limit to 200MB
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      showPopupMessage("File size too large. Please use files smaller than 200MB.", "error");
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(5);
    setProcessingStatus("Reading file...");
    
    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".txt")) {
        // For large text files, use FileReader with progress
        const reader = new FileReader();
        
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 50);
            setProcessingProgress(progress);
            setProcessingStatus(`Reading file... ${Math.round((e.loaded / 1024 / 1024) * 100) / 100}MB`);
          }
        };

        reader.onload = async (e) => {
          const text = e.target?.result as string;
          setProcessingProgress(50);
          setInputText(text);
          showPopupMessage("TXT file uploaded successfully!", "success");

          if (autoExtract) {
            await extractEmailsFromText(text, true);
          } else {
            setIsProcessing(false);
            setProcessingProgress(0);
            setProcessingStatus("");
          }
        };

        reader.onerror = () => {
          showPopupMessage("Error reading file", "error");
        };

        reader.readAsText(file);
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const reader = new FileReader();
        
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 30);
            setProcessingProgress(progress);
            setProcessingStatus(`Reading Excel file... ${Math.round((e.loaded / 1024 / 1024) * 100) / 100}MB`);
          }
        };

        reader.onload = async (e) => {
          const buffer = e.target?.result as ArrayBuffer;
          await processExcelFile(buffer);
        };

        reader.onerror = () => {
          showPopupMessage("Error reading Excel file", "error");
        };

        reader.readAsArrayBuffer(file);
      } else {
        showPopupMessage("Unsupported file type. Only TXT and Excel files are allowed.", "error");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("File upload error:", error);
      showPopupMessage("Error processing file. Please try again.", "error");
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const copyToClipboard = async (provider = "all") => {
    let emailsToCopy: string[] = [];
    
    if (provider === "all") {
      emailsToCopy = Object.values(extractedEmails).flat();
    } else {
      emailsToCopy = extractedEmails[provider];
    }

    if (emailsToCopy.length === 0) {
      showPopupMessage("No emails to copy!", "warning");
      return;
    }

    try {
      await navigator.clipboard.writeText(emailsToCopy.join("\n"));
      const providerName = provider === "all" ? "All" : providers[provider].name;
      showPopupMessage(`${providerName} emails copied to clipboard!`, "success");
    } catch (err) {
      showPopupMessage("Failed to copy emails!", "error");
    }
  };

  const downloadTxt = (provider = "all") => {
    let emailsToDownload: string[] = [];
    let fileName = "extracted_emails.txt";
    
    if (provider === "all") {
      emailsToDownload = Object.values(extractedEmails).flat();
    } else {
      emailsToDownload = extractedEmails[provider];
      fileName = `${provider}_emails.txt`;
    }

    if (emailsToDownload.length === 0) {
      showPopupMessage("No emails to download!", "warning");
      return;
    }

    const blob = new Blob([emailsToDownload.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const providerName = provider === "all" ? "All" : providers[provider].name;
    showPopupMessage(`${providerName} emails downloaded as TXT file!`, "success");
  };

  const downloadExcel = (provider = "all") => {
    let emailsToDownload: string[] = [];
    let fileName = "extracted_emails.xlsx";
    
    if (provider === "all") {
      emailsToDownload = Object.values(extractedEmails).flat();
    } else {
      emailsToDownload = extractedEmails[provider];
      fileName = `${provider}_emails.xlsx`;
    }

    if (emailsToDownload.length === 0) {
      showPopupMessage("No emails to download!", "warning");
      return;
    }

    try {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Email"],
        ...emailsToDownload.map(email => [email]),
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Emails");
      XLSX.writeFile(wb, fileName);
      
      const providerName = provider === "all" ? "All" : providers[provider].name;
      showPopupMessage(`${providerName} emails downloaded as Excel file!`, "success");
    } catch (error) {
      showPopupMessage("Error creating Excel file!", "error");
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      showPopupMessage("Text pasted from clipboard!", "success");

      if (autoExtract && text.length < 50000) { // Only auto-extract for smaller texts
        await extractEmailsFromText(text, true);
      }
    } catch (err) {
      showPopupMessage("Failed to paste from clipboard!", "error");
    }
  };

  const clearAll = () => {
    // Terminate worker if running
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    
    setInputText("");
    setExtractedEmails({
      gmail: [],
      yahoo: [],
      hotmail: [],
      outlook: [],
      others: []
    });
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingStatus("");
    setProcessedCount(0);
    showPopupMessage("All data cleared!", "success");
  };

  // Cancel processing
  const cancelProcessing = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingStatus("");
    setProcessedCount(0);
    showPopupMessage("Processing cancelled", "warning");
  };

  // Memoized calculations to prevent unnecessary re-renders
  const totalEmails = useMemo(() => Object.values(extractedEmails).flat().length, [extractedEmails]);
  
  const getFilteredEmails = useMemo(() => {
    if (selectedProvider === "all") {
      return Object.entries(extractedEmails).filter(([_, emails]) => emails.length > 0);
    } else {
      return [[selectedProvider, extractedEmails[selectedProvider]]];
    }
  }, [selectedProvider, extractedEmails]);

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
        : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
    } py-4 sm:py-8 px-2 sm:px-4`}>
      <div className="container mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
            <Filter className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-800"
          } mb-2`}>
            📧 Email Provider Extractor
          </h1>
          <p className={`text-sm sm:text-base ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          } max-w-2xl mx-auto px-4`}>
            Extract and categorize emails by provider: Gmail, Yahoo, Hotmail, Outlook
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <div className={`${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white/20"
            } rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border backdrop-blur-lg`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                <h2 className={`text-lg sm:text-xl font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-800"
                } flex items-center gap-2`}>
                  <Upload size={18} className="sm:w-5 sm:h-5" />
                  Input Text
                </h2>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setAutoExtract(!autoExtract)}
                    className={`px-2 sm:px-3 py-1 text-xs rounded-lg transition-all flex-1 sm:flex-none ${
                      autoExtract
                        ? "bg-blue-500 text-white"
                        : isDarkMode 
                          ? "bg-gray-700 text-gray-300" 
                          : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {autoExtract ? "✓" : "×"} Auto
                  </button>
                  <button
                    onClick={() => setAutoCopy(!autoCopy)}
                    className={`px-2 sm:px-3 py-1 text-xs rounded-lg transition-all flex-1 sm:flex-none ${
                      autoCopy
                        ? "bg-green-500 text-white"
                        : isDarkMode 
                          ? "bg-gray-700 text-gray-300" 
                          : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {autoCopy ? "✓" : "×"} Copy
                  </button>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (autoExtract && e.target.value.length < 50000 && e.target.value.length > 0) {
                        extractEmailsFromText(e.target.value, true);
                      }
                    }}
                    placeholder="Paste your text containing email addresses here..."
                    className={`w-full h-48 sm:h-64 p-3 sm:p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base ${
                      isDarkMode 
                        ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" 
                        : "border-gray-200 bg-white placeholder-gray-500"
                    }`}
                    disabled={isProcessing}
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-xl">
                      <LoadingSpinner size="lg" />
                      <div className="mt-2 text-sm font-medium text-center">
                        {processingStatus}
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${processingProgress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs mt-1">
                        {processingProgress}% • {processedCount} emails found
                      </div>
                      <button
                        onClick={cancelProcessing}
                        className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={pasteFromClipboard}
                    className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                    disabled={isProcessing}
                  >
                    <Copy size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Paste</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-sm"
                    disabled={isProcessing}
                  >
                    <Upload size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Upload</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => extractEmailsFromText(inputText)}
                    className="px-3 sm:px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm"
                    disabled={isProcessing || !inputText}
                  >
                    <Mail size={14} className="sm:w-4 sm:h-4" />
                    Extract Emails
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm"
                    disabled={isProcessing}
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    Clear
                  </button>
                </div>

                {/* Enhanced file size warning */}
                <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} text-center space-y-1`}>
                  <div>⚠️ Large files (&gt;50MB) use Web Workers for better performance</div>
                  <div>📊 Maximum file size: 200MB</div>
                  <div>🚀 Processing is now non-blocking and cancellable</div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            <div className={`${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white/20"
            } rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border backdrop-blur-lg`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <h2 className={`text-lg sm:text-xl font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-800"
                } flex items-center gap-2`}>
                  <Filter size={18} className="sm:w-5 sm:h-5" />
                  Extracted Emails ({totalEmails})
                </h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className={`px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-auto ${
                      isDarkMode 
                        ? "border-gray-600 bg-gray-700 text-white" 
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <option value="all">All Providers</option>
                    {Object.entries(providers).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.name} ({extractedEmails[key].length})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(selectedProvider)}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                      disabled={isProcessing || totalEmails === 0}
                    >
                      <Copy size={14} />
                      <span className="hidden sm:inline">Copy</span>
                    </button>
                    <button
                      onClick={() => downloadExcel(selectedProvider)}
                      className="px-3 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                      disabled={isProcessing || totalEmails === 0}
                    >
                      <Download size={14} />
                      <span className="hidden sm:inline">Excel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Provider Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {Object.entries(providers).map(([key, config]) => (
                  <div key={key} className={`${config.color} rounded-lg p-2 sm:p-3 text-white`}>
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl mb-1">{config.icon}</div>
                      <div className="text-xs sm:text-sm font-medium truncate">{config.name}</div>
                      <div className="text-sm sm:text-lg font-bold">{extractedEmails[key].length}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Email List */}
              <div className={`${
                isDarkMode ? "bg-gray-700" : "bg-gray-50"
              } rounded-xl h-64 sm:h-96 overflow-y-auto`}>
                {totalEmails > 0 ? (
                  <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                    {getFilteredEmails.map(([provider, emails]) => (
                      emails.length > 0 && (
                        <div key={provider} className="space-y-2">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <h3 className={`font-medium ${
                              isDarkMode ? "text-white" : "text-gray-800"
                            } flex items-center gap-2 text-sm sm:text-base`}>
                              <span className="text-base sm:text-lg">{providers[provider].icon}</span>
                              {providers[provider].name} ({emails.length})
                            </h3>
                            <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => copyToClipboard(provider)}
                                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors flex-1 sm:flex-none"
                              >
                                Copy
                              </button>
                              <button
                                onClick={() => downloadTxt(provider)}
                                className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors flex-1 sm:flex-none"
                              >
                                TXT
                              </button>
                              <button
                                onClick={() => downloadExcel(provider)}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors flex-1 sm:flex-none"
                              >
                                Excel
                              </button>
                            </div>
                          </div>
                          <div className={`${
                            isDarkMode ? "bg-gray-800" : "bg-white"
                          } rounded-lg p-2 sm:p-3 space-y-1`}>
                            {emails.slice(0, 100).map((email, index) => (
                              <div key={index} className={`flex items-center gap-2 p-2 hover:${
                                isDarkMode ? "bg-gray-700" : "bg-gray-50"
                              } rounded group`}>
                                <Mail size={12} className={`${
                                  isDarkMode ? "text-gray-400" : "text-gray-400"
                                } sm:w-4 sm:h-4`} />
                                <span className={`text-xs sm:text-sm ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                } flex-1 break-all`}>{email}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(email);
                                    showPopupMessage("Email copied!", "success");
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                >
                                  <Copy size={10} className={`${
                                    isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                                  } sm:w-3 sm:h-3`} />
                                </button>
                              </div>
                            ))}
                            {emails.length > 100 && (
                              <div className={`text-center text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              } py-2`}>
                                ... and {emails.length - 100} more emails. Use download to get all.
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className={`h-full flex flex-col items-center justify-center ${
                    isDarkMode ? "text-gray-400" : "text-gray-400"
                  } p-4`}>
                    <Mail size={32} className="sm:w-12 sm:h-12 mb-3 opacity-30" />
                    <p className="text-center font-medium text-sm sm:text-base">No emails extracted yet</p>
                    <p className="text-xs sm:text-sm opacity-75 mt-1 text-center">Paste text and click "Extract Emails"</p>
                  </div>
                )}
              </div>
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

      {/* Popup */}
      <SecurityPopup
        show={showPopup}
        message={popupMessage}
        type={popupType}
        onClose={() => setShowPopup(false)}
      />

      {/* Enhanced Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white"
          } rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl`}>
            <div className="text-center">
              <LoadingSpinner size="lg" className="mb-4" />
              <h3 className="text-lg font-semibold mb-2">Processing Large Dataset</h3>
              <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-4 text-sm`}>
                {processingStatus}
              </p>
              <div className={`w-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} rounded-full h-3 mb-2`}>
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span>{processingProgress}% complete</span>
                <span>{processedCount} emails found</span>
              </div>
              <button
                onClick={cancelProcessing}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel Processing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailProviderExtractor;