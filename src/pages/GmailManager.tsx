import React, { useState, useEffect } from "react";
import {
  Mail,
  Copy,
  Check,
  X,
  Upload,
  RefreshCw,
  SkipForward,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useSecurity } from "../contexts/SecurityContext";
import { useTheme } from "../contexts/SecurityContext";
import { gmailAccountsTable } from "../utils/supabase";

interface GmailAccount {
  id: string;
  email: string;
  status: "unused" | "used" | "blacklisted";
  created_at: string;
  last_used_at?: string;
  user_id: string;
}

interface UserProfile {
  id: string;
  keyName: string;
  email?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

interface GmailStats {
  total: number;
  unused: number;
  used: number;
  blacklisted: number;
}

const GmailManager: React.FC = () => {
  const { currentProfile } = useSecurity();
  const { isDarkMode } = useTheme();
  const [emails, setEmails] = useState<GmailAccount[]>([]);
  const [recentlyUsedEmails, setRecentlyUsedEmails] = useState<GmailAccount[]>(
    []
  );
  const [currentEmail, setCurrentEmail] = useState<GmailAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileContent, setFileContent] = useState<string>("");
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [stats, setStats] = useState<GmailStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<
    "unused" | "used" | "blacklisted" | "all"
  >("unused");

  // Initialize master record when component mounts
  useEffect(() => {
    let isMounted = true;

    const initializeMasterRecord = async () => {
      if (!currentProfile) return;

      try {
        setLoading(true);
        // Get or create master record
        await gmailAccountsTable.getOrCreate(currentProfile.id);

        // Only proceed if component is still mounted
        if (isMounted) {
          // After master record is initialized, fetch emails
          await fetchEmails();
        }
      } catch (error) {
        console.error("Error initializing master record:", error);
        if (isMounted) {
          setMessage({
            text: "মাস্টার রেকর্ড তৈরি করতে সমস্যা হয়েছে",
            type: "error",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeMasterRecord();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [currentProfile]);

  // Fetch emails from Supabase
  const fetchEmails = async () => {
    if (!currentProfile) {
      setMessage({
        text: "অনুগ্রহ করে লগইন করুন",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      // Use the user's ID from the current profile
      const userId = currentProfile.id;

      // Use the Supabase utility to fetch emails
      const [data, recentlyUsed, statistics] = await Promise.all([
        gmailAccountsTable.getUnusedEmails(userId, 20),
        gmailAccountsTable.getRecentlyUsedEmails(userId, 10),
        gmailAccountsTable.getStatistics(userId),
      ]);

      setEmails(data);
      setRecentlyUsedEmails(recentlyUsed);
      setStats(statistics);

      if (data.length === 0) {
        setMessage({
          text: "কোন বৈধ ইমেইল পাওয়া যায়নি। অনুগ্রহ করে ইমেইল আপলোড করুন।",
          type: "info",
        });
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
      setMessage({
        text: "ইমেইল লোড ব্যর্থ হয়েছে। অনুগ্রহ করে আপনার সংযোগ চেক করুন এবং আবার চেষ্টা করুন।",
        type: "error",
      });
      // Reset states on error
      setEmails([]);
      setRecentlyUsedEmails([]);
      setStats({
        total: 0,
        unused: 0,
        used: 0,
        blacklisted: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateEmail = () => {
    if (emails.length === 0) {
      setMessage({ text: "কোন ব্যবহার না করা ইমেইল নেই", type: "error" });
      return;
    }

    const email = emails[0];
    setCurrentEmail(email);
    setEmails(prevEmails => prevEmails.slice(1));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ text: "Email copied to clipboard", type: "success" });
    setTimeout(() => setMessage(null), 2000);
  };

  const markEmailAs = async (status: "used" | "blacklisted") => {
    if (!currentEmail) return;

    try {
      setLoading(true);
      // Use the Supabase utility to update email status
      await gmailAccountsTable.updateEmailStatus(currentEmail.id, status);

      // If marking as used, automatically copy to clipboard
      if (status === "used") {
        copyToClipboard(currentEmail.email);
      }

      setMessage({
        text: `ইমেইল ${status === "used" ? "এবং ক্লিপবোর্ডে কপি হয়েছে" : ""}`,
        type: "success",
      });

      // Update recently used emails if marking as used
      if (status === "used" && currentProfile) {
        setRecentlyUsedEmails(prev => [
          {
            ...currentEmail,
            status: "used",
            updated_at: new Date().toISOString(),
          },
          ...prev.slice(0, 9),
        ]);
      }

      // Generate next email automatically
      generateEmail();

      // Update statistics
      if (currentProfile) {
        const statistics = await gmailAccountsTable.getStatistics(
          currentProfile.id
        );
        setStats(statistics);
      }
    } catch (error) {
      console.error(`Error marking email as ${status}:`, error);
      setMessage({ text: `ইমেইল মার্ক করা ব্যর্থ হয়েছে`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const markAsUnused = async (email: GmailAccount) => {
    if (!currentProfile) return;

    try {
      setLoading(true);
      await gmailAccountsTable.updateEmailStatus(email.id, "unused");

      // Remove from recently used list
      setRecentlyUsedEmails(prev => prev.filter(e => e.id !== email.id));

      // Add back to unused emails
      setEmails(prev => [...prev, { ...email, status: "unused" }]);

      // Update statistics
      const statistics = await gmailAccountsTable.getStatistics(
        currentProfile.id
      );
      setStats(statistics);

      setMessage({
        text: "ইমেইল ব্যাপ্তিতে মার্ক করা হয়েছে",
        type: "success",
      });
    } catch (error) {
      console.error("Error marking email as unused:", error);
      setMessage({
        text: "ইমেইল ব্যাপ্তিতে মার্ক করা ব্যর্থ হয়েছে",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
    // Reset the file input after reading
    event.target.value = "";
  };

  const uploadEmails = async () => {
    if (!currentProfile) {
      setMessage({
        text: "অনুগ্রহ করে লগইন করুন",
        type: "error",
      });
      return;
    }

    try {
      setUploading(true);
      setMessage({
        text: "ইমেইল আপলোড করা হচ্ছে...",
        type: "info",
      });

      // Parse emails from file content
      const emailList = fileContent
        .split(/[\n,]/)
        .map(email => email.trim())
        .filter(email => email.length > 0);

      if (emailList.length === 0) {
        setMessage({
          text: "ফাইলে কোন বৈধ ইমেইল পাওয়া যায়নি",
          type: "error",
        });
        setUploading(false);
        return;
      }

      // Upload emails using the Supabase utility
      const result = await gmailAccountsTable.uploadEmails(
        emailList,
        currentProfile.id
      );

      // Show appropriate message based on upload results
      if (result.uploaded.length === 0 && result.duplicates.length > 0) {
        setMessage({
          text: `সকল ইমেইল (${result.duplicates.length}টি) ইতিমধ্যে বিদ্যমান আছে`,
          type: "info",
        });
      } else if (result.duplicates.length > 0) {
        setMessage({
          text: `সফলভাবে ${result.uploaded.length}টি ইমেইল আপলোড করা হয়েছে। ${result.duplicates.length}টি ইমেইল ইতিমধ্যে বিদ্যমান ছিল।`,
          type: "success",
        });
      } else {
        setMessage({
          text: `সফলভাবে ${result.uploaded.length}টি ইমেইল আপলোড করা হয়েছে`,
          type: "success",
        });
      }

      setFileContent("");

      // Refresh the email list and stats
      await fetchEmails();
    } catch (error) {
      console.error("Upload error:", error);
      let errorMessage = "ইমেইল আপলোড ব্যর্থ হয়েছে। ";

      if (error instanceof Error) {
        if (error.message.includes("invalid_api_key")) {
          errorMessage +=
            "ডাটাবেস সংযোগ ত্রুটি। অনুগ্রহ করে আপনার সেটিংস চেক করুন।";
        } else if (error.message.includes("not found")) {
          errorMessage +=
            "ডাটাবেস টেবিল পাওয়া যায়নি। অনুগ্রহ করে সাপোর্টের সাথে যোগাযোগ করুন।";
        } else if (error.message.includes("No valid emails")) {
          errorMessage +=
            "কোন বৈধ ইমেইল পাওয়া যায়নি। অনুগ্রহ করে ইমেইল ফরম্যাট চেক করুন।";
        } else {
          errorMessage +=
            "অনুগ্রহ করে আবার চেষ্টা করুন অথবা সমস্যা থাকলে সাপোর্টের সাথে যোগাযোগ করুন।";
        }
      }

      setMessage({
        text: errorMessage,
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentProfile) return;

    try {
      setIsDeleting(true);
      setMessage({
        text: "ইমেইল ডিলিট করা হচ্ছে...",
        type: "info",
      });

      await gmailAccountsTable.deleteEmailsByStatus(
        currentProfile.id,
        deleteStatus
      );

      setMessage({
        text: `${
          deleteStatus === "all"
            ? "সকল"
            : deleteStatus === "unused"
            ? "অব্যবহৃত"
            : deleteStatus === "used"
            ? "ব্যবহৃত"
            : "ব্ল্যাকলিস্টেড"
        } ইমেইল সফলভাবে ডিলিট করা হয়েছে`,
        type: "success",
      });

      // Refresh the email list and stats
      await fetchEmails();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Delete error:", error);
      setMessage({
        text: "ইমেইল ডিলিট করতে ব্যর্থ হয়েছে",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (currentProfile) {
      fetchEmails();
    } else {
      setMessage({
        text: "অনুগ্রহ করে লগইন করুন",
        type: "info",
      });
    }
  }, [currentProfile]);

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-purple-50"
      } py-8 px-4`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1
            className={`text-3xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            } mb-2`}
          >
            Gmail Manager
          </h1>
          <p
            className={`${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            } max-w-2xl mx-auto`}
          >
            Upload, generate and track Gmail accounts with automatic status
            management
          </p>
          {currentProfile && (
            <div className="mt-2 text-sm text-blue-600 font-medium">
              Managing emails for user: {currentProfile.id}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div
          className={`${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-2xl shadow-xl p-6 mb-8`}
        >
          {/* Stats Section with Delete Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div
              className={`${
                isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
              } rounded-xl p-4 text-center relative group`}
            >
              <div className="text-3xl font-bold text-blue-600">
                {stats?.unused || 0}
              </div>
              <div
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Unused
              </div>
              {stats && stats.unused > 0 && (
                <button
                  onClick={() => {
                    setDeleteStatus("unused");
                    setShowDeleteConfirm(true);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete unused emails"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div
              className={`${
                isDarkMode ? "bg-green-900/30" : "bg-green-50"
              } rounded-xl p-4 text-center relative group`}
            >
              <div className="text-3xl font-bold text-green-600">
                {stats?.used || 0}
              </div>
              <div
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Used
              </div>
              {stats && stats.used > 0 && (
                <button
                  onClick={() => {
                    setDeleteStatus("used");
                    setShowDeleteConfirm(true);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete used emails"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div
              className={`${
                isDarkMode ? "bg-red-900/30" : "bg-red-50"
              } rounded-xl p-4 text-center relative group`}
            >
              <div className="text-3xl font-bold text-red-600">
                {stats?.blacklisted || 0}
              </div>
              <div
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Blacklisted
              </div>
              {stats && stats.blacklisted > 0 && (
                <button
                  onClick={() => {
                    setDeleteStatus("blacklisted");
                    setShowDeleteConfirm(true);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete blacklisted emails"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div
              className={`${
                isDarkMode ? "bg-purple-900/30" : "bg-purple-50"
              } rounded-xl p-4 text-center relative group`}
            >
              <div className="text-3xl font-bold text-purple-600">
                {stats?.total || 0}
              </div>
              <div
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Total
              </div>
              {(stats?.total || 0) > 0 && (
                <button
                  onClick={() => {
                    setDeleteStatus("all");
                    setShowDeleteConfirm(true);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete all emails"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div
                className={`${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } rounded-lg p-6 max-w-md w-full mx-4`}
              >
                <h3
                  className={`text-xl font-semibold mb-4 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Confirm Delete
                </h3>
                <p
                  className={`mb-6 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Are you sure you want to delete{" "}
                  {deleteStatus === "all" ? "all" : deleteStatus} emails?
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className={`px-4 py-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Email Generator */}
          <div
            className={`mb-8 p-6 border ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            } rounded-xl`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Gmail Generator
            </h2>
            {!currentProfile ? (
              <div
                className={`text-center p-6 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                } rounded-lg`}
              >
                <p
                  className={`mb-4 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Please log in to access your Gmail accounts
                </p>
                <a
                  href="/login"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Go to Login
                </a>
              </div>
            ) : currentEmail ? (
              <div className="flex flex-col">
                <div
                  className={`flex items-center justify-between p-4 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-50"
                  } rounded-lg mb-4`}
                >
                  <div
                    className={`font-mono text-lg ${
                      isDarkMode ? "text-white" : ""
                    }`}
                  >
                    {currentEmail.email}
                  </div>
                  <button
                    onClick={() => copyToClipboard(currentEmail.email)}
                    className={`p-2 ${
                      isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                    } rounded-full transition-colors`}
                    title="Copy to clipboard"
                  >
                    <Copy
                      className={`w-5 h-5 ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => markEmailAs("used")}
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Mark as Used & Copy
                  </button>
                  <button
                    onClick={() => markEmailAs("blacklisted")}
                    className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Blacklist & Skip
                  </button>
                  <button
                    onClick={generateEmail}
                    className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center"
                  >
                    <SkipForward className="w-5 h-5 mr-2" />
                    Skip
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center p-6 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                } rounded-lg`}
              >
                <p
                  className={`mb-4 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {emails.length > 0
                    ? "Click the button below to generate a Gmail account"
                    : "No unused emails available. Please upload some emails."}
                </p>
                <button
                  onClick={generateEmail}
                  disabled={emails.length === 0 || loading}
                  className={`px-6 py-3 rounded-lg text-white font-medium flex items-center justify-center ${
                    emails.length === 0 || loading
                      ? "bg-gray-400"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Generate Email"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Upload Section */}
          {currentProfile && (
            <div
              className={`mb-8 p-6 border ${
                isDarkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-gray-50"
              } rounded-xl`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  isDarkMode ? "text-white" : ""
                }`}
              >
                Upload Gmail Accounts
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <label
                  className={`flex-1 flex items-center justify-center px-4 py-3 border ${
                    isDarkMode
                      ? "border-gray-600 hover:bg-gray-700"
                      : "border-gray-300 hover:bg-gray-100"
                  } rounded-lg cursor-pointer transition-colors`}
                >
                  <Upload className="w-5 h-5 mr-2 text-blue-500" />
                  <span
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Select File
                  </span>
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={uploadEmails}
                  disabled={!fileContent || uploading}
                  className={`flex-1 px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center ${
                    !fileContent || uploading
                      ? "bg-gray-400"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  }`}
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Emails"
                  )}
                </button>
              </div>
              {fileContent && (
                <div
                  className={`mt-2 text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {fileContent.split("\n").length} lines detected
                </div>
              )}
            </div>
          )}

          {/* Recently Used Emails */}
          {recentlyUsedEmails.length > 0 && (
            <div
              className={`mb-8 p-6 border ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              } rounded-xl`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  isDarkMode ? "text-white" : ""
                }`}
              >
                Recently Used Emails
              </h2>
              <div className="space-y-2">
                {recentlyUsedEmails.map(email => (
                  <div
                    key={email.id}
                    className={`flex items-center justify-between p-3 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-50"
                    } rounded-lg`}
                  >
                    <div
                      className={`font-mono ${isDarkMode ? "text-white" : ""}`}
                    >
                      {email.email}
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => copyToClipboard(email.email)}
                        className={`p-2 ${
                          isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                        } rounded-full transition-colors mr-2`}
                        title="Copy to clipboard"
                      >
                        <Copy
                          className={`w-4 h-4 ${
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => markAsUnused(email)}
                        className={`p-2 ${
                          isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                        } rounded-full transition-colors`}
                        title="Mark as unused"
                      >
                        <RotateCcw
                          className={`w-4 h-4 ${
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${
              message.type === "success"
                ? "bg-green-600"
                : message.type === "error"
                ? "bg-red-600"
                : "bg-blue-600"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default GmailManager;
