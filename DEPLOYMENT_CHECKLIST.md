# Deployment Checklist - FPM System V1
Follow this guide to deploy your app with all critical fixes implemented.

## Phase 1: Environment Setup (30 min)
### 1.1 Get Supabase Credentials
- [ ] Go to: https://app.supabase.com
- [ ] Select your project
- [ ] Navigate to Settings → API
- [ ] Copy and save:
  - `Project URL`
  - `Anon Key`
  - `Service Role Key`
  - `JWT Secret`

### 1.2 Create .env.local File
```bash
cp .env.example .env.local
```
Edit `.env.local` and add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your-jwt-secret
```
⚠️ **NEVER commit .env.local**
- [ ] Add to `.gitignore` (should already be there)

### 1.3 Install Dependencies
```bash
npm install zod
npm install jose
```

## Phase 2: Database Setup (30 min)
### 2.1 Create Indexes
Go to Supabase Dashboard → SQL Editor and run:
```sql
-- Create indexes for performance
CREATE INDEX idx_hantaran_user_date ON hantaran_hasil(user_id, created_at DESC);
CREATE INDEX idx_hantaran_no_resit ON hantaran_hasil(no_resit);
```

### 2.2 Add UNIQUE Constraint
```sql
-- Prevent duplicate entries per user
ALTER TABLE hantaran_hasil ADD CONSTRAINT unique_no_resit_per_user UNIQUE(user_id, no_resit);
```

### 2.3 Add RLS (Row Level Security) Policies
Enable RLS on `hantaran_hasil` table:
```sql
-- Enable RLS
ALTER TABLE hantaran_hasil ENABLE ROW LEVEL SECURITY;
-- Policy: Users can only see their own data
CREATE POLICY "Users can see own data" ON hantaran_hasil FOR SELECT USING (auth.uid() = user_id);
-- Policy: Users can only insert their own data
CREATE POLICY "Users can insert own data" ON hantaran_hasil FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Policy: Users can only update their own data
CREATE POLICY "Users can update own data" ON hantaran_hasil FOR UPDATE USING (auth.uid() = user_id);
-- Policy: Users can only delete their own data
CREATE POLICY "Users can delete own data" ON hantaran_hasil FOR DELETE USING (auth.uid() = user_id);
```
- [ ] Run all SQL commands
- [ ] Verify in Supabase: Authentication → RLS Policies
- [ ] Status should show all 4 policies enabled

## Phase 3: Local Testing (45 min)
### 3.1 Checkout Feature Branch
```bash
git fetch origin
git checkout fix/pre-deployment-critical-fixes
```
### 3.2 Test Build
```bash
npm run build
```
Expected output:
✅ `Successfully compiled`
- [ ] Build passes without errors
- [ ] Check console for warnings
- [ ] No TypeScript errors

### 3.3 Test Dev Server
```bash
npm run dev
```
Visit http://localhost:3000
- [ ] App loads without errors
- [ ] Navigation works
- [ ] Real-time updates work
- [ ] OCR/file upload works

### 3.4 Test API Endpoints
Use curl or Postman:
```bash
# Get your Supabase JWT token first
# Then test POST
curl -X POST http://localhost:3000/api/hantaran \ 
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \ 
  -H "Content-Type: application/json" \ 
  -d '{"no_resit":"TEST001","blok":"5","tan":100.50}'
```
Expected:
✅ `{"success": true}`
- [ ] POST endpoint returns success
- [ ] GET endpoint returns paginated data
- [ ] 401 error without authorization header
- [ ] 400 error with invalid data

### 3.5 Test Error Scenarios
- [ ] Send request without auth header → should get 401
- [ ] Send invalid data (negative tan) → should get 400
- [ ] Send duplicate no_resit → should get 409
- [ ] Check console logs are structured JSON

## Phase 4: Pre-Production (30 min)
### 4.1 Merge Feature Branch
```bash
git checkout main
git merge fix/pre-deployment-critical-fixes
git push origin main
```
- [ ] PR created and reviewed
- [ ] No merge conflicts
- [ ] Pushed to main branch

### 4.2 Production Environment Variables
Go to your deployment platform:
#### Vercel
- [ ] Project Settings → Environment Variables
- [ ] Add all 4 variables
- [ ] Check Production environment selected

#### Railway / Render
- [ ] Project Settings → Environment
- [ ] Add all 4 variables
- [ ] Restart deployment

### 4.3 Pre-Deployment Smoke Tests
```bash
npm run build
```
- [ ] Production build succeeds
- [ ] No unused dependencies warnings
- [ ] Bundle size reasonable

## Phase 5: Production Deployment (30 min)
### 5.1 Deploy
#### Vercel (Easiest)
```bash
vercel deploy --prod
```
Just push to main and it auto-deploys!
#### Railway / Render
- [ ] Connected to GitHub
- [ ] Trigger deploy on main push
- [ ] Wait for build to complete
- [ ] Check deployment logs for errors

#### Docker / Custom
- [ ] Build: `docker build -t fpmsystem .`
- [ ] Test locally
- [ ] Push to registry
- [ ] Deploy to server

### 5.2 Verify Deployment
- [ ] Visit your production URL
- [ ] App loads correctly
- [ ] Real-time updates work
- [ ] File upload works
- [ ] Check production logs in Supabase

## Phase 6: Post-Deployment Monitoring (Ongoing)
### 6.1 Set Up Monitoring (Optional but Recommended)
- [ ] Install Sentry: `npm install @sentry/nextjs`
- [ ] Create Sentry account
- [ ] Add DSN to `.env.local` and deployment platform
- [ ] Test error tracking

### 6.2 Monitor Logs
- [ ] Check Supabase real-time logs
- [ ] Monitor function execution times
- [ ] Set up alerts for errors

### 6.3 Performance Baseline
- [ ] Record initial load time
- [ ] Record OCR processing time
- [ ] Record API response times
- [ ] Use these as reference for future optimizations

---
## 🎯 Summary
What's Fixed Before Deployment:
✅ Security: Now uses SERVICE_ROLE_KEY instead of ANON_KEY
✅ Authentication: All API routes now verify JWT tokens
✅ Validation: Input validation with Zod schema
✅ Resource Cleanup: OCR worker properly cleaned up
✅ Real-Time: Subscriptions properly unsubscribed
✅ Logging: Structured JSON logging for debugging
✅ Pagination: GET endpoint supports pagination
✅ Data Integrity: UNIQUE constraint prevents duplicates

---
## 📞 Troubleshooting
### Build Fails "Cannot find module 'zod'"
```bash
npm install zod
npm run build
```
### Deployment Says Missing Environment Variables
- [ ] Check all 4 env vars are added
- [ ] Restart deployment
- [ ] Verify variable names exactly match
### OCR Worker Not Cleaning Up
- [ ] Check browser DevTools Console
- [ ] Look for error messages
- [ ] Verify finally block is executing
### Real-Time Updates Not Working
- [ ] Check user_id is set
- [ ] Verify RLS policies are enabled
- [ ] Check network tab in DevTools
---
## ✅ Deployment Complete!
Once all phases pass, your app is ready for production! 🚀