import React, { useState, useCallback, useRef, useMemo } from "react";
import { Mail, Copy, Download, Trash2, Upload, Users, Filter, AtSign } from "lucide-react";
import { useSecurity } from "../contexts/SecurityContext";
import { useTheme } from "../contexts/SecurityContext";
import SecurityPopup from "../components/SecurityPopup";
import LoadingSpinner from "../components/LoadingSpinner";
import * as XLSX from "xlsx/xlsx.mjs";
import { createEmailWorker } from "../utils/emailWorker";

const EmailProviderExtractor: React.FC = () => {
  // ... [previous code remains the same until the processSmallDataset function]

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

  // ... [rest of the code remains the same]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AtSign className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Email Provider Extractor</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Input Method
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setInputMethod('text')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      inputMethod === 'text'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Text Input
                  </button>
                  <button
                    onClick={() => setInputMethod('file')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      inputMethod === 'file'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    File Upload
                  </button>
                </div>
              </div>

              {inputMethod === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paste your text containing emails
                  </label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste text containing email addresses here..."
                    className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload file (.txt, .csv, .xlsx)
                  </label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      Drag and drop a file here, or{' '}
                      <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                        browse
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          accept=".txt,.csv,.xlsx,.xls"
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Supports .txt, .csv, .xlsx files
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleExtractEmails(false)}
                  disabled={isProcessing || (!inputText.trim() && !uploadedFile)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  Extract Emails
                </button>
                <button
                  onClick={() => handleExtractEmails(true)}
                  disabled={isProcessing || (!inputText.trim() && !uploadedFile)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Extract & Copy
                </button>
              </div>

              {isProcessing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-blue-700 font-medium">Processing...</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    {processingProgress}% complete • {processedCount} emails processed
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Results</h3>
                {Object.values(extractedEmails).some(arr => arr.length > 0) && (
                  <div className="flex gap-2">
                    <button
                      onClick={copyAllEmails}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy All
                    </button>
                    <button
                      onClick={downloadEmails}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                    <button
                      onClick={clearResults}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {Object.entries(extractedEmails).map(([provider, emails]) => (
                  <div key={provider} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-800 capitalize">
                          {provider === 'others' ? 'Other Providers' : provider}
                        </span>
                        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                          {emails.length}
                        </span>
                      </div>
                      {emails.length > 0 && (
                        <button
                          onClick={() => copyProviderEmails(provider)}
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      )}
                    </div>
                    {emails.length > 0 ? (
                      <div className="max-h-32 overflow-y-auto">
                        <div className="text-sm text-gray-600 space-y-1">
                          {emails.slice(0, 5).map((email, index) => (
                            <div key={index} className="font-mono text-xs">
                              {email}
                            </div>
                          ))}
                          {emails.length > 5 && (
                            <div className="text-xs text-gray-500 italic">
                              ... and {emails.length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No emails found</p>
                    )}
                  </div>
                ))}
              </div>

              {Object.values(extractedEmails).some(arr => arr.length > 0) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Summary</h4>
                  <div className="text-sm text-blue-700">
                    <p>
                      Total emails extracted:{' '}
                      <span className="font-semibold">
                        {Object.values(extractedEmails).reduce((sum, arr) => sum + arr.length, 0)}
                      </span>
                    </p>
                    <p>Processing time: {processingTime}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSecurityPopup && (
        <SecurityPopup
          message={popupMessage}
          type={popupType}
          onClose={() => setShowSecurityPopup(false)}
        />
      )}
    </div>
  );
};

export default EmailProviderExtractor;