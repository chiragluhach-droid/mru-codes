# Fix Vercel Deployment Error

## Issue
"Application error: a server-side exception has occurred"
"Failed to fetch analytics"  
Error when clicking Student Performance tab

## Root Cause
The Prisma schema was updated with `hackerRankUsername` field, but:
1. The database column doesn't exist yet (need to run `prisma db push`)
2. OR the Prisma client wasn't regenerated after schema change

## 🔧 **SOLUTION (Follow in Order)**

### Step 1: Add Database Column Manually
Since Vercel doesn't auto-run migrations, add the column manually in Supabase:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run this SQL:

```sql
-- Add hackerrank_username column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hackerrank_username TEXT;

-- Verify it was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND column_name = 'hackerrank_username';
```

5. Click "Run"
6. Should see: `Column added successfully` or `Column already exists`

### Step 2: Update Build Script
Update `package.json` to include database push:

```json
{
  "scripts": {
    "build": "prisma generate && prisma db push --accept-data-loss && next build"
  }
}
```

**Or safer (without data loss flag):**
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "vercel-build": "prisma generate && prisma db push --skip-generate && next build"
  }
}
```

**Current script is fine if Step 1 is done:**
```json
"build": "prisma generate && next build"
```

### Step 3: Force Redeploy on Vercel

1. Go to https://vercel.com/dashboard
2. Select your project (mru-codes-seven)
3. Go to **Deployments** tab
4. Click the **three dots** (⋯) on the latest deployment
5. Click **"Redeploy"**
6. **IMPORTANT**: Uncheck ☐ "Use existing Build Cache"
7. Click **"Redeploy"** button

This will:
- ✅ Run `prisma generate` with updated schema
- ✅ Regenerate Prisma client with `hackerRankUsername` field
- ✅ Fix the analytics API error

### Step 4: Verify Fix

After deployment completes:

1. ✅ Go to your app: https://mru-codes-seven.vercel.app
2. ✅ Login as teacher
3. ✅ Go to Dashboard
4. ✅ Click "Student Performance" tab
5. ✅ Should load without error (not "Failed to fetch analytics")
6. ✅ Click "HackerRank Stats" tab
7. ✅ Should show empty state or connected students

## 🐛 If Still Failing

### Check Vercel Logs:
1. Vercel Dashboard → Your Project
2. Go to **"Logs"** or **"Functions"**
3. Filter by: `/api/analytics/teacher`
4. Look for actual error message
5. Common errors:
   - `column "hackerrank_username" does not exist` → Do Step 1 again
   - `Cannot find module '@prisma/client'` → Do Step 3 again (clear cache)
   - `PrismaClientInitializationError` → Check DATABASE_URL in Vercel env vars

### Check Database:
```sql
-- Verify column exists
SELECT * FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'hackerrank_username';

-- Should return 1 row with column details
```

### Nuclear Option (If Nothing Works):
```bash
# Locally (won't work due to TLS, but try anyway)
npx prisma db push --force-reset --skip-generate
npx prisma generate

# Commit a trivial change to trigger redeploy
git commit --allow-empty -m "fix: Trigger Vercel redeploy"
git push origin main
```

## Expected Behavior After Fix

### Student Performance Tab:
- ✅ Loads without errors
- ✅ Shows analytics charts
- ✅ Shows student metrics
- ✅ Filters work (department, section)
- ✅ Export buttons work

### HackerRank Stats Tab:
- ✅ Loads without errors
- ✅ Shows "No students found" if none connected
- ✅ Shows students who connected HackerRank accounts
- ✅ Filters and refresh work

### No Console Errors:
- ✅ No "Server Components render" errors
- ✅ No "Failed to fetch analytics"
- ✅ No digest errors

## 📝 Summary

**TL;DR:**
1. Run SQL in Supabase to add column (Step 1)
2. Redeploy on Vercel without cache (Step 3)
3. Test both tabs work

---

**Most Common Issue**: Forgot to add database column in Supabase.
**Second Most Common**: Vercel used cached build (didn't regenerate Prisma).

Let me know which step fails!

