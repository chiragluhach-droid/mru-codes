# Fix HackerRank Feature - Exact Commands

## Current Situation
- ✅ Prisma schema has `hackerRankUsername` field
- ❌ Database column doesn't exist yet
- ❌ Prisma client not regenerated
- ❌ Teacher performance dashboard failing

## Solution: 3 Steps

---

## Step 1: Push Schema to Database

This will create the `hackerrank_username` column in Supabase.

### Command:
```bash
npx prisma db push --accept-data-loss
```

### What it does:
- Creates missing column in database
- No data loss (safe - only adding a nullable column)
- Uses `DIRECT_URL` to bypass PgBouncer

### Expected Output:
```
Environment variables loaded from .env.local
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres"

🚀  Your database is now in sync with your Prisma schema.
```

### If it fails with TLS error:
**Expected due to your local TLS issues.** Skip to Manual Database Step below.

---

## Step 2: Regenerate Prisma Client

This ensures your code recognizes the new field.

### Command:
```bash
npx prisma generate
```

### What it does:
- Regenerates `@prisma/client` with updated schema
- Includes `hackerRankUsername` in TypeScript types

### Expected Output:
```
✔ Generated Prisma Client (5.x.x) to .\node_modules\@prisma\client
```

### This should work locally (no database connection needed)

---

## Step 3: Verify & Deploy

### Local Verification (if Step 1 worked):
```bash
# Check the schema is in sync
npx prisma db pull

# Should show no changes needed
```

### Push to Vercel:
```bash
git add .
git commit -m "fix: Regenerate Prisma client with hackerRankUsername"
git push origin main
```

---

## Manual Database Step (If Local Commands Fail)

Since your local machine has TLS issues, you'll need to add the column manually:

### Option A: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project (fxrevnhtlgimazymdpqv)
3. Click **"SQL Editor"** in sidebar
4. Click **"New Query"**
5. Paste this SQL:
   ```sql
   ALTER TABLE profiles 
   ADD COLUMN IF NOT EXISTS hackerrank_username TEXT;
   ```
6. Click **"Run"** (or Ctrl+Enter)
7. Verify success ✅

### Option B: Using npx (May work)
```bash
# This might bypass TLS issues
npx @supabase/supabase-js@latest
```
**Note:** This is a client library, won't help with migrations.

### Option C: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push

# Or execute SQL directly
supabase db execute "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hackerrank_username TEXT;"
```

---

## Complete Fix Script (Run in Order)

```bash
# 1. Try database push (will likely fail locally)
npx prisma db push --accept-data-loss

# If above fails, manually add column in Supabase Dashboard (see above)

# 2. Regenerate Prisma Client (should work)
npx prisma generate

# 3. Commit and push to Vercel
git add .
git commit -m "fix: Add hackerRankUsername field to database schema"
git push origin main
```

---

## Verification Commands

### After pushing to Vercel, check if it worked:

1. **Check Vercel Deployment Logs:**
   - Go to https://vercel.com/dashboard
   - Your project → Deployments → Latest
   - Look for `prisma generate` in build logs

2. **Test the endpoints:**
   ```bash
   # Test if analytics API works (replace with your URL)
   curl https://mru-codes-seven.vercel.app/api/analytics/teacher
   
   # Should not return "Server-side exception"
   ```

3. **Check in browser:**
   - Login as teacher
   - Go to Dashboard → Student Performance
   - Should load without error ✅

---

## Expected Timeline

| Step | Time | Success Indicator |
|------|------|-------------------|
| Manual DB Column | 2 min | ✅ "Success" in Supabase |
| Prisma Generate | 30 sec | ✅ "Generated Prisma Client" |
| Git Push | 1 min | ✅ Pushed to origin |
| Vercel Deploy | 2-3 min | ✅ Deployment succeeded |
| Test Dashboard | 30 sec | ✅ No errors loading |

**Total: ~6 minutes**

---

## Troubleshooting

### Issue: `P1001: Can't reach database server`
**Cause:** Local TLS certificate issue
**Fix:** Use Manual Database Step (Supabase Dashboard)

### Issue: `prisma generate` fails
**Error:** Usually doesn't fail
**Fix:** 
```bash
npm install @prisma/client
npx prisma generate
```

### Issue: Vercel build fails
**Check:** Build logs for `prisma generate` command
**Fix:** Ensure `package.json` has:
```json
"build": "prisma generate && next build"
```
(You already have this ✅)

### Issue: Dashboard still shows error after deployment
**Possible causes:**
1. Vercel used cached build
2. Database column still missing
3. Environment variables not set

**Fix:**
1. Go to Vercel → Deployments
2. Click ⋯ on latest deployment
3. Click "Redeploy"
4. **UNCHECK** "Use existing Build Cache"
5. Click "Redeploy"

---

## Summary: What You Need to Do

### If Local Commands Work:
```bash
npx prisma db push --accept-data-loss
npx prisma generate
git add .
git commit -m "fix: Add hackerRankUsername to schema"
git push origin main
```

### If Local Commands Fail (Expected):
1. **Manually add column in Supabase Dashboard** (2 min)
   - SQL: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hackerrank_username TEXT;`
2. **Regenerate Prisma locally** (30 sec)
   ```bash
   npx prisma generate
   ```
3. **Push to Vercel** (1 min)
   ```bash
   git add .
   git commit -m "fix: Regenerate Prisma client"
   git push origin main
   ```
4. **Wait for Vercel deployment** (2-3 min)
5. **Test dashboard** (30 sec)

---

## Status Checklist

After running commands, check these:

- [ ] Database has `hackerrank_username` column
- [ ] Local Prisma client regenerated
- [ ] Changes committed to git
- [ ] Pushed to GitHub
- [ ] Vercel deployment succeeded
- [ ] Teacher performance dashboard loads ✅
- [ ] HackerRank stats tab works ✅
- [ ] No console errors

---

**Bottom Line:** Use Supabase Dashboard to add the column (2 min), then push to Vercel. Done.
