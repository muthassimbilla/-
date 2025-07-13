-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Add constraints
  CONSTRAINT emails_email_user_unique UNIQUE (email, user_id),
  CONSTRAINT emails_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS emails_email_idx ON emails(email);
CREATE INDEX IF NOT EXISTS emails_user_id_idx ON emails(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own emails" ON emails;
DROP POLICY IF EXISTS "Users can view their own emails" ON emails;
DROP POLICY IF EXISTS "Users can update their own emails" ON emails;
DROP POLICY IF EXISTS "Users can delete their own emails" ON emails;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON emails FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON emails FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for own emails"
  ON emails FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for own emails"
  ON emails FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id); 