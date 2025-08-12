# Frontend Routes Documentation

## Overview
This document defines all frontend routes in the nano-Grazynka application to ensure consistency and prevent routing errors.

## Route Structure

### Public Routes (No Authentication Required)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `app/page.tsx` | Homepage with upload interface |
| `/login` | `app/(auth)/login/page.tsx` | User login |
| `/register` | `app/(auth)/register/page.tsx` | User registration |
| `/pricing` | `app/pricing/page.tsx` | Pricing plans |

### Protected Routes (Authentication Required)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | `app/dashboard/page.tsx` | User dashboard with stats and recent notes |
| `/settings` | `app/settings/page.tsx` | User account settings |
| `/library` | `app/library/page.tsx` | Voice notes library |
| `/note/[id]` | `app/note/[id]/page.tsx` | Individual voice note details |
| `/payment/success` | `app/payment/success/page.tsx` | Payment confirmation |

## Important Notes

### ⚠️ Correct Route Pattern
- **Voice Note Details**: `/note/[id]` 
- **NOT**: `/voice-notes/[id]` ❌
- **NOT**: `/voice-note/[id]` ❌

### Backend API vs Frontend Routes
Backend API endpoints use `/api/voice-notes/*` but frontend routes use `/note/*`:
- Backend: `GET /api/voice-notes/{id}` → Frontend: `/note/{id}`
- Backend: `POST /api/voice-notes/{id}/process` → No direct frontend route
- Backend: `GET /api/voice-notes/{id}/export` → Accessed from `/note/{id}` page

### Navigation Examples
```typescript
// Correct navigation after processing
<Link href={`/note/${voiceNoteId}`}>View Results</Link>

// Correct navigation in dashboard
<Link href={`/note/${note.id}`}>View</Link>

// Incorrect (will cause 404)
<Link href={`/voice-notes/${id}`}>View</Link> // ❌ Wrong
```

## Route Protection
- Anonymous users can access: `/`, `/login`, `/register`, `/pricing`
- Authenticated users can access all routes
- Anonymous users can view their own notes via `/note/[id]` if they have the ID

## Updates History
- 2025-08-12: Fixed route mismatch - changed from `/voice-notes/[id]` to `/note/[id]`
- 2025-08-12: Documented correct routing patterns to prevent future errors