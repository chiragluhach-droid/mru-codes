-- Migration: Add hackerrank_username to profiles table
-- This will be automatically applied when deploying to Render

-- Add the hackerrank_username column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'hackerrank_username'
    ) THEN
        ALTER TABLE profiles ADD COLUMN hackerrank_username TEXT;
        RAISE NOTICE 'Column hackerrank_username added successfully';
    ELSE
        RAISE NOTICE 'Column hackerrank_username already exists, skipping';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'hackerrank_username';
