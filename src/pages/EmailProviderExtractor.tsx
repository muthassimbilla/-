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
    // ... [JSX remains the same]
  );
};

export default EmailProviderExtractor;