## 📋 **Business Requirements Document - User System & Monetization MVP**

## ⚠️ ARCHIVED DOCUMENT

**This document has been archived as of August 12, 2025.**

**➡️ Please refer to [PRD_ACTUAL.md](./PRD_ACTUAL.md) for the current, comprehensive requirements documentation.**

This archive contains the user system and monetization requirements and is preserved for historical reference only. All active development should reference PRD_ACTUAL.md, which includes:
- All requirements from the original PRD.md
- All requirements from this document
- Complete implementation status  
- Pending features and roadmap

---

> **Status:** ARCHIVED  
> **Archived:** August 12, 2025

---
**📌 IMPLEMENTATION STATUS: ✅ ALL PHASES COMPLETE**

**Implementation Date**: August 12, 2025  
**Status**: All three phases fully implemented and operational

**See [PRD_ACTUAL.md](./PRD_ACTUAL.md) for complete implementation details.**

### Implementation Summary:
- **Phase 1 (Core User System)**: ✅ Complete with JWT auth, bcrypt, full session management
- **Phase 2 (Usage & Limits)**: ✅ Complete with credit system, rate limiting, mock Stripe
- **Phase 3 (Enhanced UX)**: ✅ Complete with dashboard, settings, real-time indicators

### Key Achievements:
- Implemented beyond requirements with anonymous user support
- Added rate limiting (not in original spec)
- Full mock payment system ready for production Stripe
- Public-first UX allowing immediate value without registration

---

### **Phase 1: Core User System**

#### **1.1 Registration Flow**
- User provides email and password (min 8 characters)
- Email must be unique in system
- Account created immediately (no email verification for MVP)
- Auto-login after registration
- Default to Free tier

#### **1.2 Authentication**
- Login with email/password
- "Remember me" checkbox (30-day session)
- Logout clears session
- Password reset sends email with reset link (can be console.log in MVP)
- No account lockout for MVP (add later)

#### **1.3 User Profile Structure**
```
User Account:
- Email (unique identifier)
- Password (hashed)
- Tier: 'free' | 'pro' | 'business'
- Credits used this month: 0-5
- Credits reset date: 1st of month
- Account created date
- Last login date
```

---

### **Phase 2: Limits & Tiers (with Mocked Stripe)**

#### **2.1 Free Tier Restrictions**
**Monthly allowance:**
- 5 voice note transcriptions per calendar month
- Counter shows: "3 of 5 voice notes used"
- Resets automatically on 1st of each month at 00:00 UTC
- Reprocessing counts as new transaction
- Failed processing doesn't count

**When limit reached:**
- Upload button disabled with message: "Monthly limit reached"
- Show upgrade CTA: "Upgrade to Pro for unlimited voice notes"
- Can still: view, export, delete existing notes
- Cannot: upload new files, reprocess existing

#### **2.2 Mocked Payment Flow**
**Upgrade button triggers:**
1. Redirect to `/upgrade` page
2. Show pricing: Free → Pro ($9/mo) → Business ($29/mo)
3. Click "Upgrade to Pro" → Mocked Stripe checkout
4. **MOCK BEHAVIOR**:
   - Show fake Stripe checkout page
   - Accept any test card: `4242 4242 4242 4242`
   - Instant "success" → Update user tier to 'pro'
   - Show success message: "Welcome to Pro!"

**Mocked subscription management:**
- `/account/billing` page shows:
  - Current plan: Pro
  - Next billing date: [30 days from upgrade]
  - [Cancel Plan] button → Reverts to free tier
  - [Change Plan] → Switch between tiers
  - Mock invoice history

#### **2.3 Rate Limiting Rules**
**Per-user limits:**
- 10 uploads per hour
- 20 API requests per minute
- 3 concurrent processing jobs

**Free vs Pro differences:**
| Limit | Free | Pro |
|-------|------|-----|
| File size | 25MB | 200MB |
| Audio duration | 10 min | 2 hours |
| Processing priority | Standard | Fast lane |
| Concurrent uploads | 1 | 3 |

---

### **Phase 3: Enhanced UX**

#### **3.1 User Dashboard**
**Requirements for logged-in home page:**

```
Dashboard Layout:
┌─────────────────────────────────────┐
│ Welcome back, user@email.com       │
│ Free Plan · 3/5 notes used         │
├─────────────────────────────────────┤
│       [📎 Upload Voice Note]        │
├─────────────────────────────────────┤
│ This Month                          │
│ ▫ 3 notes processed                │
│ ▫ 12 action items extracted        │
│ ▫ 47 minutes transcribed           │
├─────────────────────────────────────┤
│ Recent Notes                        │
│ • "Team standup" - 2 hours ago     │
│ • "Product ideas" - Yesterday      │
│ • "Customer call" - Dec 29         │
└─────────────────────────────────────┘
```

#### **3.2 Processing Status Indicators**
**Real-time feedback during processing:**

```
Status stages:
1. "Uploading..." (0-30%)
2. "Analyzing audio..." (30-40%)  
3. "Transcribing with Whisper..." (40-70%)
4. "Generating summary..." (70-90%)
5. "Extracting action items..." (90-100%)
6. "Complete!" → Redirect to note view
```

**Failure states:**
- "Processing failed - Please try again"
- "File too large for your plan"
- "Invalid audio format"

#### **3.3 Account Settings Page**
**User-configurable options:**

```
Settings Page:
- Account
  · Email: [user@email.com] [Change]
  · Password: [••••••••] [Change]
  · Plan: Free [Upgrade]
  
- Preferences  
  · Default language: [EN/PL dropdown]
  · Email notifications: [On/Off toggle]
  · Auto-process uploads: [On/Off toggle]
  
- Usage
  · This month: 3/5 voice notes
  · Total processed: 47 notes
  · Member since: Dec 1, 2024
  
- Danger Zone
  · [Export All Data]
  · [Delete Account]
```

#### **3.4 Navigation Updates**
**When logged out:**
- Home (landing page)
- Features
- Pricing
- Login
- Sign Up

**When logged in:**
- Dashboard
- Library
- Upload (prominent)
- Settings
- Logout

---

## 🎯 **Implementation Checkpoints**

### **Checkpoint 1: Basic Auth Working**
- [ ] User can sign up with email/password
- [ ] User can login and see dashboard
- [ ] Session persists on refresh
- [ ] Logout works

### **Checkpoint 2: Usage Limits Active**
- [ ] Upload counter increments correctly
- [ ] 5-upload limit blocks 6th upload
- [ ] Counter resets on month change
- [ ] "Upgrade" CTA appears when limit hit

### **Checkpoint 3: Mocked Payments**
- [ ] Upgrade page shows pricing
- [ ] Mock Stripe checkout accepts test card
- [ ] User tier updates to 'pro' after "payment"
- [ ] Pro users have no upload limit

### **Checkpoint 4: Enhanced UX Complete**
- [ ] Dashboard shows usage stats
- [ ] Processing shows stage indicators
- [ ] Settings page functional
- [ ] All user preferences saved and applied

---

## 📊 **Test Scenarios**

### **Free User Journey:**
1. Sign up → Land on dashboard
2. Upload 5 notes successfully
3. Try 6th upload → Blocked with upgrade prompt
4. Wait for month reset → Counter back to 0/5

### **Upgrade Journey:**
1. Hit limit → Click upgrade
2. Select Pro plan → Enter test card
3. Success → Return to dashboard as Pro
4. Upload unlimited notes
5. Cancel subscription → Back to free next month

### **Rate Limit Testing:**
1. Upload 11 files rapidly → 11th blocked
2. Wait 1 hour → Can upload again
3. Free user uploads 30MB file → Rejected
4. Pro user uploads 30MB file → Accepted

---

## 🚀 **Business Metrics to Track**

**User Metrics:**
- Total registered users
- Daily active users
- Average notes per user per month

**Conversion Metrics:**
- Free → Pro conversion rate
- Point of upgrade (at 5/5 limit? Earlier?)
- Churn rate (Pro → Free)

**Usage Metrics:**
- Average audio duration
- Most common upload times
- Processing success rate
- Average processing time

This gives you a complete business specification without diving into code details. The mocked Stripe means you can test the full user journey without dealing with real payments! 🎯