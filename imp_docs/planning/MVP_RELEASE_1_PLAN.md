# MVP Release 1 Plan - Minimal Viable Launch

**Created**: January 16, 2025  
**Timeline**: 5 days (after YAML and Entity systems)  
**Status**: Planning Complete  
**Dependencies**: To be executed AFTER YAML Prompt System and Entity-Project System

## Important Note

This plan assumes completion of:
1. **YAML Prompt System** (3 days) - Foundation for prompt management
2. **Entity-Project System** (4-5 days) - Knowledge management for better transcription

The scope and requirements may need revision based on learnings from those implementations.

## Current State Assessment

### ✅ What's Already Working
- User registration and authentication (JWT-based)
- Login/logout flow  
- Anonymous user support with migration to registered accounts
- Core transcription and summarization (GPT-4o + Gemini)
- MockStripe payment endpoints configured
- Observability 90% complete (LangSmith + OpenLLMetry enabled)
- Voice note library with AI-generated titles
- Usage tracking and credit system

### ❌ What's Missing/Broken for MVP
- Dashboard displays mock data instead of real usage statistics
- Settings page has placeholder functionality
- No user-facing way to upgrade to Pro tier
- Missing payment success/cancel pages
- No connection between payment and tier upgrade

## MVP Release 1 Scope (Absolute Minimum)

### Day 1-2: Dashboard - Make It Real
**Goal**: Replace mock data with actual user statistics

#### Essential Features
- [ ] Fetch and display REAL usage data from database
  - Credits used vs credit limit
  - Percentage indicator or progress bar
- [ ] Show actual recent voice notes (last 5)
  - Title, date, status
  - Click to navigate to detail page
- [ ] Display current subscription tier (free/pro)
- [ ] Show monthly reset date
- [ ] Add "Upgrade to Pro" CTA if on free tier

#### Implementation Details
```typescript
// API endpoint needed: GET /api/dashboard/stats
{
  creditsUsed: number,
  creditLimit: number,
  tier: 'free' | 'pro',
  monthlyResetDate: string,
  recentNotes: Array<{
    id: string,
    title: string,
    createdAt: string,
    status: string
  }>
}
```

#### NOT Included in MVP
- Charts or graphs
- Performance metrics
- Export functionality
- Detailed analytics

### Day 3: Settings - Core Functions Only
**Goal**: Minimal viable settings for account management

#### Essential Features
- [ ] Display user email (read-only)
- [ ] Show current tier with benefits list
- [ ] Display usage statistics (same as dashboard)
- [ ] Working "Upgrade to Pro" button
  - Links to MockStripe checkout
  - Shows pricing ($9.99/month)
- [ ] Functional logout button

#### Implementation Details
```typescript
// Use existing user data from AuthContext
// Button action: POST /api/payments/create-checkout-session
```

#### NOT Included in MVP
- Email notification preferences
- Password change functionality
- Delete account option
- Export all data
- Default language settings
- API key management

### Day 4: Payment Flow Completion
**Goal**: Complete the payment upgrade journey

#### Essential Features
- [ ] Create `/payment/success` page
  - Simple confirmation message
  - "Your account has been upgraded to Pro!"
  - Redirect to dashboard after 3 seconds
- [ ] Create `/payment/cancel` page
  - "Payment cancelled" message
  - "Return to settings" button
- [ ] Implement webhook handler for MockStripe
  - Update user tier in database
  - Increase credit limit (5 → 50)
- [ ] Test complete checkout flow

#### Implementation Details
```typescript
// New pages needed:
// - frontend/app/payment/success/page.tsx
// - frontend/app/payment/cancel/page.tsx

// Backend update needed:
// - POST /api/payments/webhook (already exists, needs testing)
```

#### NOT Included in MVP
- Real Stripe integration (MockStripe is sufficient)
- Invoice history
- Subscription management
- Cancel subscription flow
- Payment method management

### Day 5: Integration Testing & Polish
**Goal**: Ensure everything works end-to-end

#### Essential Tasks
- [ ] Update PROJECT_STATUS.md
  - Mark observability as 90% complete
  - Add Release 1 as current phase
- [ ] Remove all placeholder text from dashboard/settings
- [ ] Add "Upgrade to Pro" modal when hitting free tier limits
- [ ] Create test script for complete user journey
- [ ] Test critical paths:
  1. Register → Upload → Process → View
  2. Hit limit → See upgrade prompt → Pay → Continue
  3. Login → Check dashboard → Logout

#### Bug Fixes & Cleanup
- [ ] Ensure session cleanup on logout
- [ ] Verify credit reset logic
- [ ] Check error handling for payment failures
- [ ] Remove any debug console.log statements

## Features Deliberately Excluded from Release 1

These features are important but not essential for initial launch:

| Feature | Reason for Exclusion | Target Phase |
|---------|---------------------|--------------|
| Audio Playback | Nice-to-have, not core to transcription | Post-Release 1 |
| Reprocessing History | Advanced feature, adds complexity | Post-Release 1 |
| Email System | Can launch without email notifications | Release 2 |
| Password Reset (Email) | Simplified version exists | Release 2 |
| Advanced Settings | Not needed for basic usage | Release 2 |
| Data Export | Privacy feature, not MVP critical | Release 2 |
| Account Deletion | Can handle manually initially | Release 2 |

## Success Criteria for Release 1

The MVP is considered complete when:

1. ✅ **User Registration & Auth**
   - Users can register with email/password
   - Users can login and logout
   - Sessions persist across page refreshes

2. ✅ **Core Functionality** 
   - Users can upload audio files
   - Transcription and summarization work
   - Results are saved and viewable

3. 🔄 **Usage Tracking** (To implement)
   - Dashboard shows real usage data
   - Credit limits are enforced
   - Monthly reset works

4. 🔄 **Payment Flow** (To implement)
   - Users can upgrade to Pro tier
   - Payment updates tier and limits
   - MockStripe integration works end-to-end

5. 🔄 **Basic Account Management** (To implement)
   - Users can view their account info
   - Users can see their current plan
   - Users can upgrade their account

## Technical Considerations

### Database Queries Needed
- Dashboard stats aggregation
- Recent voice notes query
- Usage tracking updates
- Tier upgrade logic

### API Endpoints to Verify/Create
- GET /api/dashboard/stats (create)
- GET /api/user/settings (verify)
- POST /api/payments/webhook (verify)

### Frontend Routes to Create
- /payment/success
- /payment/cancel

### Environment Variables to Verify
- STRIPE_SECRET_KEY (MockStripe)
- STRIPE_WEBHOOK_SECRET (MockStripe)
- FRONTEND_URL (for redirects)

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Payment integration issues | Use MockStripe for Release 1, real Stripe later |
| Complex dashboard requirements | Show only essential metrics |
| Settings page scope creep | Strictly limit to 5 listed features |
| Testing delays | Create automated test script on Day 5 |

## Post-Release 1 Roadmap

After successful Release 1, prioritize:
1. **Week 1**: Monitor user feedback and fix critical bugs
2. **Week 2**: Implement email system for password reset
3. **Week 3**: Add audio playback feature
4. **Week 4**: Begin reprocessing history feature

## Definition of Done

Release 1 is complete when:
- [ ] All essential features are implemented
- [ ] Complete user journey test passes
- [ ] No critical bugs remain
- [ ] PROJECT_STATUS.md is updated
- [ ] Basic documentation exists
- [ ] MockStripe payment flow works

## Notes

- This plan prioritizes launching quickly with core features
- User feedback will guide post-Release 1 priorities
- MockStripe allows testing payment flows without real money
- The 5-day timeline assumes no major blockers

---

*This plan will be revisited after completing the YAML Prompt System and Entity-Project System implementations, as those may impact requirements or reveal new insights.*