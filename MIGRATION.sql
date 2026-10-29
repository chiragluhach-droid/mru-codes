-- Migration: Add hackerrank_username to profiles table
-- Run this in Supabase SQL Editor

-- Step 1: Add the column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hackerrank_username TEXT;

-- Step 2: Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND column_name = 'hackerrank_username';

-- Expected output: 1 row showing the column details
-- column_name: hackerrank_username
-- data_type: text
-- is_nullable: YES
-- column_default: NULL

-- Step 3: (Optional) Check if any students have already set their HackerRank username
SELECT 
    full_name,
    email,
    hackerrank_username
FROM profiles
WHERE role = 'student'
AND hackerrank_username IS NOT NULL;

-- If no rows, that's normal (no students connected HackerRank yet)
