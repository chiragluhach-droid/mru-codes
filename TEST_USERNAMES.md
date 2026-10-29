# HackerRank Test Usernames

Use these verified HackerRank usernames for testing the feature on production:

## Working Test Usernames

### 1. **demo**
- Problems Solved: 1263
- Stars: ~4-5
- Rank: Knight
- Score: 1745
- Profile: https://www.hackerrank.com/demo

### 2. **shashank21j**
- Active HackerRank user
- Good for testing
- Profile: https://www.hackerrank.com/shashank21j

### 3. **uwi**
- Highly active user
- Many problems solved
- Profile: https://www.hackerrank.com/uwi

### 4. **rajat1603**
- Contest participant
- Profile: https://www.hackerrank.com/rajat1603

### 5. **amitpandey**
- Regular user
- Profile: https://www.hackerrank.com/amitpandey

## Testing Scenarios

### Scenario 1: Basic Connection
1. Use username: **demo**
2. Should show ~1263 problems solved
3. Rank: Knight
4. Score: ~1745

### Scenario 2: Invalid Username
1. Use username: **this_user_definitely_does_not_exist_12345**
2. Should show error message
3. Stats should be 0 or show error state

### Scenario 3: Multiple Students
Create 3 test student accounts and connect them with:
- Student 1: **demo**
- Student 2: **shashank21j**
- Student 3: **uwi**

Then check teacher dashboard shows all three.

### Scenario 4: Department Filtering
If you have students in CSE and AIML:
- Connect HackerRank for students in both departments
- Use department filter to view each separately

### Scenario 5: Search Functionality
- Search by name: Enter student's name
- Search by roll number: Enter roll number
- Search by username: Enter "demo"
All should filter correctly.

## API Testing

### Direct API Test
You can test the HackerRank Stats API directly:

```bash
# Test with demo user
curl https://hackerrank-stats.tashif.codes/demo/profile

# Expected response:
{
  "status": "success",
  "platform": "hackerrank",
  "username": "demo",
  "cached": false,
  "data": {
    "totalSolved": 1263,
    "totalActiveDays": 608,
    "totalContests": 57,
    "currentRating": 1745,
    "maxRating": 1803,
    "rank": "Knight",
    "badgesCount": 24
  }
}
```

### Your App API Test
After deployment, test your own API:

```bash
# Replace YOUR_RENDER_URL with your actual Render URL
curl https://YOUR_RENDER_URL/api/hackerrank/stats?username=demo
```

Should return your app's formatted response.

## Notes

- All usernames are real HackerRank users
- Their profiles are public
- Stats may change over time as they solve more problems
- Use "demo" for consistent testing (official demo account)

## Creating Your Own Test Account

1. Go to https://www.hackerrank.com/
2. Create a free account
3. Solve a few problems (optional)
4. Use your username for testing
5. Your stats will be real and updateable

---

**Happy Testing! 🎉**
