import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

let supabaseInitialized = false;
let supabase: any;

try {
  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl === "YOUR_SUPABASE_URL" ||
    supabaseKey === "YOUR_SUPABASE_ANON_KEY"
  ) {
    console.error("⚠️ Supabase configuration missing!");
    console.error("VITE_SUPABASE_URL:", supabaseUrl);
    console.error("VITE_SUPABASE_ANON_KEY:", supabaseKey);
  } else {
    // Create Supabase client
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: "public",
      },
    });
    supabaseInitialized = true;
    console.log("✅ Supabase initialized with URL:", supabaseUrl);

    // Test database connection
    (async () => {
      try {
        // Test device_configs
        const { data: deviceData, error: deviceError } = await supabase
          .from("device_configs")
          .select("*");

        if (deviceError) {
          console.error("❌ Error fetching device_configs:", deviceError);
        } else {
          console.log("✅ device_configs data:", deviceData);
        }

        // Test version_configs
        const { data: versionData, error: versionError } = await supabase
          .from("version_configs")
          .select("*");

        if (versionError) {
          console.error("❌ Error fetching version_configs:", versionError);
        } else {
          console.log("✅ version_configs data:", versionData);
        }

        // Test app_configs
        const { data: appData, error: appError } = await supabase
          .from("app_configs")
          .select("*");

        if (appError) {
          console.error("❌ Error fetching app_configs:", appError);
        } else {
          console.log("✅ app_configs data:", appData);
        }
      } catch (error) {
        console.error("❌ Database connection test failed:", error);
      }
    })();
  }
} catch (error) {
  console.error("Failed to initialize Supabase:", error);
}

// Export a function to check if Supabase is initialized
export const isSupabaseInitialized = () => supabaseInitialized;

// Export the Supabase client
export { supabase };

// Test connection and table existence
(async () => {
  try {
    console.log("Testing Supabase connection...");

    // Test basic connection
    const { data: tableInfo, error: tableError } = await supabase
      .from("gmail_accounts")
      .select("id")
      .limit(1);

    if (tableError) {
      console.error("Supabase connection error:", {
        code: tableError.code,
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint,
      });

      if (tableError.code === "PGRST116") {
        console.error("Table 'gmail_accounts' does not exist!");
      } else if (tableError.code === "invalid_api_key") {
        console.error("Invalid Supabase API key!");
      } else if (tableError.code === "invalid_url") {
        console.error("Invalid Supabase URL!");
      }
      throw tableError;
    }

    console.log("✓ Supabase connected successfully!");
  } catch (error) {
    console.error("Supabase initialization failed:", error);
    throw error;
  }
})();

interface EmailStatus {
  status: "unused" | "used" | "blacklisted";
}

// Gmail accounts table operations
export const gmailAccountsTable = {
  // Clean up duplicate master records
  cleanupMasterRecords: async (userId: string) => {
    try {
      // Get all master records for this user
      const { data: masters, error } = await supabase
        .from("gmail_accounts")
        .select("*")
        .eq("user_id", userId)
        .is("email", null);

      if (error) throw error;

      // If we have multiple master records
      if (masters && masters.length > 1) {
        // Keep the oldest one, delete the rest
        const [keeper, ...extras] = masters.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const extraIds = extras.map(m => m.id);

        // Delete the extra records
        const { error: deleteError } = await supabase
          .from("gmail_accounts")
          .delete()
          .in("id", extraIds);

        if (deleteError) throw deleteError;

        console.log(`Cleaned up ${extras.length} duplicate master records`);
        return keeper;
      }

      return masters?.[0] || null;
    } catch (error) {
      console.error("Failed to cleanup master records:", error);
      throw error;
    }
  },

  // Get or create user record
  getOrCreate: async (userId: string) => {
    try {
      // First try to get existing record with both user_id and null email
      let { data: users, error } = await supabase
        .from("gmail_accounts")
        .select("*")
        .eq("user_id", userId)
        .is("email", null)
        .maybeSingle(); // This will return null if no record found, instead of throwing error

      if (error) throw error;

      // If we found a master record, return it
      if (users) {
        return users;
      }

      // Create new user record if not exists
      const { data: newUser, error: createError } = await supabase
        .from("gmail_accounts")
        .insert({
          user_id: userId,
          email: null,
          status: "unused",
          total_emails: 0,
          unused_count: 0,
          used_count: 0,
          blacklisted_count: 0,
        })
        .select()
        .single();

      if (createError) {
        // If we got a unique constraint error, it means another request created the record
        // Try to fetch it one more time
        if (createError.code === "23505") {
          const { data: existingUser, error: fetchError } = await supabase
            .from("gmail_accounts")
            .select("*")
            .eq("user_id", userId)
            .is("email", null)
            .single();

          if (fetchError) throw fetchError;
          return existingUser;
        }
        throw createError;
      }
      return newUser;
    } catch (error) {
      console.error("Failed to get/create gmail user:", error);
      throw error;
    }
  },

  // Update user statistics
  updateStats: async (userId: string) => {
    try {
      const { data: stats, error: countError } = await supabase
        .from("gmail_accounts")
        .select("status", { count: "exact" })
        .eq("user_id", userId);

      if (countError) throw countError;

      const unused = stats.filter(
        (s: EmailStatus) => s.status === "unused"
      ).length;
      const used = stats.filter((s: EmailStatus) => s.status === "used").length;
      const blacklisted = stats.filter(
        (s: EmailStatus) => s.status === "blacklisted"
      ).length;

      const { error: updateError } = await supabase
        .from("gmail_accounts")
        .update({
          total_emails: stats.length,
          unused_count: unused,
          used_count: used,
          blacklisted_count: blacklisted,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Failed to update gmail user stats:", error);
      throw error;
    }
  },

  // Fetch unused emails
  getUnusedEmails: async (userId: string, limit = 10) => {
    try {
      const { data, error } = await supabase
        .from("gmail_accounts")
        .select("id, email, status, created_at, last_used_at")
        .eq("status", "unused")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to fetch unused emails:", error);
      throw error;
    }
  },

  // Get recently used emails
  getRecentlyUsedEmails: async (userId: string, limit = 10) => {
    try {
      const { data, error } = await supabase
        .from("gmail_accounts")
        .select("id, email, status, created_at, last_used_at")
        .eq("status", "used")
        .eq("user_id", userId)
        .order("last_used_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to fetch used emails:", error);
      throw error;
    }
  },

  // Update email status
  updateEmailStatus: async (
    id: string,
    status: "used" | "blacklisted" | "unused"
  ) => {
    try {
      const { error } = await supabase
        .from("gmail_accounts")
        .update({
          status,
          last_used_at: status === "used" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Failed to update email status to ${status}:`, error);
      throw error;
    }
  },

  // Upload multiple emails
  uploadEmails: async (emails: string[], userId: string) => {
    try {
      console.log("Uploading emails for user:", userId);

      // Validate emails first
      const validEmails = emails.filter(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
      });

      if (validEmails.length === 0) {
        throw new Error("No valid emails found in the input");
      }

      // Process in batches of 100 to avoid payload size limits
      const batchSize = 100;
      const results = [];
      const duplicates = [];

      for (let i = 0; i < validEmails.length; i += batchSize) {
        const batch = validEmails.slice(i, i + batchSize);

        // First check which emails already exist
        const { data: existingEmails } = await supabase
          .from("gmail_accounts")
          .select("email")
          .in(
            "email",
            batch.map(e => e.trim())
          );

        const existingEmailSet = new Set(
          existingEmails?.map(e => e.email) || []
        );

        // Filter out duplicates
        const newEmails = batch.filter(
          email => !existingEmailSet.has(email.trim())
        );
        duplicates.push(
          ...batch.filter(email => existingEmailSet.has(email.trim()))
        );

        if (newEmails.length > 0) {
          const emailsToUpload = newEmails.map(email => ({
            email: email.trim(),
            status: "unused",
            user_id: userId,
          }));

          const { data, error } = await supabase
            .from("gmail_accounts")
            .insert(emailsToUpload)
            .select();

          if (error) {
            console.error(`Error uploading batch ${i / batchSize + 1}:`, error);
            throw error;
          }

          if (data) {
            results.push(...data);
          }
        }
      }

      return {
        uploaded: results,
        duplicates: duplicates,
      };
    } catch (error) {
      console.error("Failed to upload emails:", error);
      throw error;
    }
  },

  // Get email statistics
  getStatistics: async (userId: string) => {
    try {
      // First get or create the user record
      await gmailAccountsTable.getOrCreate(userId);

      // Get counts for each status
      const { data: stats, error: countError } = await supabase
        .from("gmail_accounts")
        .select("status", { count: "exact" })
        .eq("user_id", userId);

      if (countError) throw countError;

      // Calculate counts
      const unused = stats.filter(
        (s: EmailStatus) => s.status === "unused"
      ).length;
      const used = stats.filter((s: EmailStatus) => s.status === "used").length;
      const blacklisted = stats.filter(
        (s: EmailStatus) => s.status === "blacklisted"
      ).length;

      return {
        total: stats.length || 0,
        unused: unused || 0,
        used: used || 0,
        blacklisted: blacklisted || 0,
      };
    } catch (error) {
      console.error("Failed to get email statistics:", error);
      throw error;
    }
  },

  // Delete emails by status
  deleteEmailsByStatus: async (
    userId: string,
    status: "unused" | "used" | "blacklisted" | "all"
  ) => {
    try {
      let query = supabase
        .from("gmail_accounts")
        .delete()
        .eq("user_id", userId);

      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { error } = await query;

      if (error) {
        console.error("Error deleting emails:", error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error("Failed to delete emails:", error);
      throw error;
    }
  },
};

// API Keys table operations
export const apiKeysTable = {
  // Fetch all API keys
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching API keys:", error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      throw error;
    }
  },

  // Add a new API key
  add: async (keyObj: {
    key: string;
    name: string;
    device_id: string;
    device_location?: any;
    created_at: string;
    expires_at: string | null;
    is_active: boolean;
  }) => {
    try {
      console.log("Adding key to Supabase:", keyObj);
      // Make sure expires_at can be null
      const keyToAdd = {
        ...keyObj,
        // Explicitly handle null case
        expires_at: keyObj.expires_at === null ? null : keyObj.expires_at,
      };

      const { data, error } = await supabase
        .from("api_keys")
        .insert([keyToAdd])
        .select();

      if (error) {
        console.error("Error adding API key:", error);
        throw error;
      }
      return data && data[0];
    } catch (error) {
      console.error("Failed to add API key:", error);
      throw error;
    }
  },

  // Remove an API key by id
  remove: async (id: string) => {
    try {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) {
        console.error("Error removing API key:", error);
        throw error;
      }
      return true;
    } catch (error) {
      console.error("Failed to remove API key:", error);
      throw error;
    }
  },

  // Update an API key by id (for device binding, etc.)
  update: async (id: string, updates: Record<string, any>) => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .update(updates)
        .eq("id", id)
        .select();
      if (error) {
        console.error("Error updating API key:", error);
        throw error;
      }
      return data && data[0];
    } catch (error) {
      console.error("Failed to update API key:", error);
      throw error;
    }
  },
};

// Types for our tables
export interface GmailAccount {
  id: string;
  email: string;
  status: "unused" | "used" | "blacklisted";
  created_at: string;
  last_used_at?: string;
  gmail_user_id: string;
}

export interface EmailUploadResult {
  uploaded: GmailAccount[];
  duplicates: string[];
}

export interface IosDeviceRange {
  id: number;
  deviceModel: string;
  minVersion: string;
  maxVersion: string;
  created_at?: string;
}

export interface IosVersion {
  id: number;
  version: string;
  build: string;
  webkit_version: string;
  created_at?: string;
}

export interface FbVersion {
  id: number;
  major: string;
  min_fbbv: number;
  max_fbbv: number;
  created_at?: string;
}

export interface SamsungConfig {
  id: number;
  model: string;
  android_version: string;
  build_number: string;
  created_at?: string;
}
