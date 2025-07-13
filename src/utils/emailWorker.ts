// Web Worker for processing large email datasets
const emailWorker = () => {
  self.onmessage = function(e) {
    const { text, chunkSize = 5000 } = e.data;
    
    try {
      // Email regex pattern
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      
      // Provider domains mapping
      const providers = {
        gmail: ["gmail.com", "googlemail.com"],
        yahoo: ["yahoo.com", "yahoo.in", "yahoo.co.in", "ymail.com"],
        hotmail: ["hotmail.com", "hotmail.co.uk", "hotmail.in", "live.com"],
        outlook: ["outlook.com", "outlook.in", "msn.com"]
      };
      
      // Initialize result object
      const result = {
        gmail: [],
        yahoo: [],
        hotmail: [],
        outlook: [],
        others: []
      };
      
      const processedEmails = new Set();
      let processedCount = 0;
      
      // Process text in chunks
      const textLength = text.length;
      
      for (let i = 0; i < textLength; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        const potentialEmails = chunk.match(emailRegex) || [];
        
        potentialEmails.forEach(email => {
          const cleanEmail = email.toLowerCase().trim();
          
          // Skip if already processed
          if (processedEmails.has(cleanEmail)) return;
          
          // Basic email validation
          if (!isValidEmail(cleanEmail)) return;
          
          processedEmails.add(cleanEmail);
          
          // Categorize email
          const category = categorizeEmail(cleanEmail, providers);
          result[category].push(cleanEmail);
        });
        
        processedCount += chunkSize;
        const progress = Math.min(Math.round((processedCount / textLength) * 100), 100);
        
        // Send progress update
        self.postMessage({
          type: 'progress',
          progress: progress,
          processed: processedEmails.size
        });
        
        // Yield control back to main thread
        if (i % (chunkSize * 10) === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      // Send final result
      self.postMessage({
        type: 'complete',
        result: result,
        totalProcessed: processedEmails.size
      });
      
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error.message
      });
    }
  };
  
  function isValidEmail(email) {
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
  }
  
  function categorizeEmail(email, providers) {
    const domain = email.split("@")[1];
    
    for (const [provider, domains] of Object.entries(providers)) {
      if (domains.includes(domain)) {
        return provider;
      }
    }
    return "others";
  }
};

// Create worker blob
const workerBlob = new Blob([`(${emailWorker.toString()})()`], {
  type: 'application/javascript'
});

export const createEmailWorker = () => {
  return new Worker(URL.createObjectURL(workerBlob));
};