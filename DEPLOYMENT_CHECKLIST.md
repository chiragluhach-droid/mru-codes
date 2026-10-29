# 🚀 HackerRank Feature Deployment Checklist

## Pre-Deployment Checks ✅

- [x] Database schema updated (`prisma/schema.prisma`)
- [x] HackerRank API updated to use reliable endpoint
- [x] Student component saves username to database
- [x] Profile API accepts `hackerRankUsername` field
- [x] Teacher component created
- [x] Teacher API endpoint created
- [x] Teacher dashboard updated with new tab
- [x] Documentation created
- [x] TypeScript type assertions added (for pre-migration compatibility)

## Files Changed (9 files)

### Modified (5 files):
1. ✅ `prisma/schema.prisma` - Added hackerRankUsername field
2. ✅ `app/api/hackerrank/stats/route.ts` - Updated API endpoint
3. ✅ `components/dashboard/hackerrank-stats-card.tsx` - Save to DB
4. ✅ `app/api/profile/me/route.ts` - Accept new field
5. ✅ `app/teacher/dashboard/page.tsx` - Added HackerRank tab

### Created (4 files):
6. ✅ `components/dashboard/teacher-hackerrank-stats.tsx` - Teacher view
7. ✅ `app/api/teacher/hackerrank-stats/route.ts` - Teacher API
8. ✅ `HACKERRANK_FEATURE.md` - Documentation
9. ✅ `DEPLOYMENT_CHECKLIST.md` - This file

## Deployment Steps

### Step 1: Commit and Push to Git
```bash
git status
git add .
git commit -m "feat: Add HackerRank stats dashboard for teachers

- Added hackerRankUsername field to Profile model
- Updated HackerRank API to use reliable endpoint (hackerrank-stats.tashif.codes)
- Student HackerRank card now saves username to database
- Created teacher dashboard view with filtering and stats
- Added teacher API endpoint for bulk stats fetching
- Includes summary cards, sortable table, and refresh functionality"

git push origin main
```

### Step 2: Monitor Render Deployment
1. Go to your Render dashboard
2. Watch the deployment logs
3. Look for:
   - ✅ "Building..."
   - ✅ "Running build command: npm run build"
   - ✅ "Build succeeded"
   - ✅ "Starting service..."
   - ✅ "Your service is live"

### Step 3: Database Migration (Automatic)
Render will automatically run one of these:
- `npx prisma migrate deploy` (if migrations folder exists)
- `npx prisma db push` (if no migrations folder)

Look for in logs:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database
✔ Generated Prisma Client
```

### Step 4: Verify Prisma Client Generated
After deployment, Prisma should show:
```
✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client
```

### Step 5: Manual Migration (If Needed)
If automatic migration fails, run in Render Shell:
```bash
npx prisma migrate deploy
# OR
npx prisma db push
# THEN
npx prisma generate
```

## Post-Deployment Testing

### Test 1: Student Flow ✅
1. Login as a student account
2. Go to Dashboard
3. Find HackerRank Stats card
4. Click "Connect" and enter a valid HackerRank username (e.g., "demo")
5. Verify:
   - Stats load correctly (not all zeros)
   - Profile link works
   - Username saved (refresh page, still there)

### Test 2: Teacher Flow ✅
1. Login as a teacher account
2. Go to Dashboard
3. Click "HackerRank Stats" tab
4. Verify:
   - Tab loads without errors
   - Summary cards show data
   - Students table displays
   - Can see students who connected HackerRank
   - Filters work (department, section, search)
   - Refresh button works
   - External profile links open correctly

### Test 3: Data Persistence ✅
1. As student, connect HackerRank account
2. Logout and login again
3. Verify username still saved
4. As teacher, view that student's stats
5. Verify stats appear in teacher dashboard

## Troubleshooting

### Issue: TypeScript Errors During Build
**Cause**: Prisma client not regenerated after schema change
**Fix**: Render should auto-run `prisma generate`, but if not:
```bash
npx prisma generate
npm run build
```

### Issue: Database Column Doesn't Exist
**Error**: `column "hackerrank_username" does not exist`
**Fix**: Run migration manually:
```bash
npx prisma migrate deploy
# OR use the SQL from MIGRATION.sql
```

### Issue: Teacher Dashboard Shows No Students
**Possible causes**:
1. No students have connected HackerRank accounts yet
   - Solution: Connect at least one student account first
2. API authentication failing
   - Check: Is user logged in as teacher?
   - Check: Supabase auth working on production?

### Issue: HackerRank Stats Show All Zeros
**Possible causes**:
1. Invalid HackerRank username
   - Verify username exists on HackerRank.com
2. HackerRank Stats API down
   - Check: https://hackerrank-stats.tashif.codes/demo/profile
   - Should return JSON with stats
3. Network/fetch issues
   - Check Render logs for fetch errors

### Issue: Stats Not Refreshing
**Solution**: Click the Refresh button in teacher dashboard
**Why**: Stats are cached by the HackerRank API

## Rollback Plan

If something goes wrong:

### Option 1: Revert Git Commit
```bash
git revert HEAD
git push origin main
```

### Option 2: Database Rollback
```sql
-- Remove the column if needed
ALTER TABLE profiles DROP COLUMN IF EXISTS hackerrank_username;
```

### Option 3: Quick Fix
- Database column will remain but unused
- Teacher tab will show error
- Students can still use platform normally
- Fix and redeploy when ready

## Success Criteria ✅

Deployment is successful when:
- [ ] No build errors in Render logs
- [ ] Service shows "Live" status on Render
- [ ] Can login to application (both student and teacher)
- [ ] Student can connect HackerRank account
- [ ] Student sees their stats (not zeros)
- [ ] Teacher can see HackerRank Stats tab
- [ ] Teacher sees list of students with stats
- [ ] Filters and refresh work
- [ ] No console errors in browser DevTools

## Important Notes

⚠️ **Local Development**: This feature will NOT work on your local machine due to TLS certificate issues. Test ONLY on Render production.

⚠️ **API Dependency**: Feature depends on `hackerrank-stats.tashif.codes` being available. If it's down, stats won't load.

⚠️ **Performance**: Fetching stats for many students (50+) may take a few seconds. This is normal.

⚠️ **Privacy**: Only public HackerRank profile data is accessed. No authentication required.

## Support Contacts

- HackerRank Stats API: https://hackerrank-stats.tashif.codes/
- API Issues: Check their GitHub repo
- Database Issues: Check Render logs and Supabase dashboard

---

**Deployment Date**: ___ / ___ / 2026
**Deployed By**: ________________
**Status**: ⬜ Pending / ⬜ Success / ⬜ Failed
**Notes**: ________________________________________
