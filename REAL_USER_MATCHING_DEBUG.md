# Real User Matching Debug Guide

## 🎯 **Issue**: Real User Not Showing in Candidate Search

**Expected**: User with skills (Gemini team, TypeScript, React) should appear in recruiter candidate searches
**Actual**: User not showing up in candidate results

## 🔧 **Fixes Applied**

### 1. **Lowered Minimum Match Score**
- ✅ Changed from 30% to 10% minimum match score
- ✅ This should catch low-confidence matches
- ✅ Location: `src/services/candidate-matching.ts` line 81

### 2. **Added Debug Tools**
- ✅ **Test Queries** button - Tests direct database queries
- ✅ **Clear Cache** button - Clears all cached data
- ✅ **Enhanced logging** in candidate matching debug API

### 3. **Created Debug Scripts**
- ✅ `debug-real-user-matching.js` - Comprehensive matching test
- ✅ `verify-fixes.js` - Verifies system fixes

## 🧪 **Testing Steps**

### **Step 1: Verify User Exists**
1. Go to recruiter dashboard
2. Click **"Check Real Users"** button
3. Verify user with TypeScript/React skills appears

### **Step 2: Test Database Queries**
1. Click **"Test Queries"** button
2. Check console for detailed candidate data
3. Verify user appears in query results

### **Step 3: Clear Caches**
1. Click **"Clear Cache"** button
2. This removes any stale cached data
3. Try candidate search again

### **Step 4: Test Candidate Matching**
1. Click **"Test Matching"** button
2. Check if user appears in matching results
3. Note the match score

### **Step 5: Run Debug Script**
```bash
node debug-real-user-matching.js
```

## 🔍 **Possible Issues & Solutions**

### **Issue 1: User Skills Not in Database**
**Symptoms**: "Check Real Users" shows 0 users with skills
**Solution**: 
- Verify AI interview properly stored skills
- Check `user_skills` table directly
- Re-run AI interview if needed

### **Issue 2: Skill Name Mismatch**
**Symptoms**: User exists but doesn't match job requirements
**Solution**:
- "Gemini team" won't match typical job skills
- "TypeScript" and "React" should match
- Check job posting requirements

### **Issue 3: Match Score Too Low**
**Symptoms**: User matches but score below threshold
**Solution**:
- ✅ Already lowered to 10% minimum
- Check actual match score in debug output
- Consider if partial matches are working

### **Issue 4: Caching Issues**
**Symptoms**: Old results persist despite changes
**Solution**:
- ✅ Added "Clear Cache" button
- Use `?refresh=true` parameter in API calls
- Restart development server if needed

### **Issue 5: Database Query Issues**
**Symptoms**: Query returns no results
**Solution**:
- Check database connection
- Verify table structure matches schema
- Check for data type mismatches

## 📊 **Expected Debug Output**

### **Successful Case**:
```
✅ Users with skills found: YES (1 user)
✅ Jobs available: YES
✅ Candidate matching works: YES
✅ Direct match API works: YES
✅ Service endpoint works: YES

User: [Name] with skills: TypeScript (85%), React (90%), Gemini team (70%)
Match Score: 15-25% (low but should appear)
```

### **Problem Case**:
```
❌ Users with skills found: NO
   → Check if AI interview stored skills properly

OR

✅ Users with skills found: YES
❌ Candidate matching works: NO
   → Check skill name matching or score calculation
```

## 🎯 **Skill Matching Logic**

The system matches skills using:

1. **Exact Match**: "TypeScript" = "TypeScript"
2. **Contains Match**: "React" matches "React.js"
3. **Synonym Match**: "TypeScript" matches "TS"
4. **Fuzzy Match**: Partial word matching

**Expected Matches for Your User**:
- ✅ "TypeScript" should match TypeScript job requirements
- ✅ "React" should match React job requirements  
- ❌ "Gemini team" unlikely to match typical job skills

## 🚀 **Next Steps**

1. **Run the debug tools** to identify the exact issue
2. **Check match scores** - even low scores should appear now
3. **Verify job requirements** include TypeScript/React
4. **Clear caches** if results seem stale
5. **Check console logs** for detailed debugging info

## 📋 **Quick Checklist**

- [ ] User exists in database (`Check Real Users`)
- [ ] User has skills stored (`Test Queries`)
- [ ] Job posting exists with relevant skills
- [ ] Minimum match score is 10% (lowered)
- [ ] Caches are cleared (`Clear Cache`)
- [ ] Debug scripts run successfully
- [ ] Console shows detailed matching process

**If all checks pass but user still doesn't appear, there may be a deeper issue with the candidate matching algorithm or database queries.**