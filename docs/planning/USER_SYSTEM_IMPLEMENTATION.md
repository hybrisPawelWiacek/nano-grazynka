# User System Implementation Guide

## 🎯 Implementation Roadmap

### Day 1: Database & Backend Auth Core
- [ ] Update Prisma schema with User, Session, UsageLog tables
- [ ] Run migrations to create new tables
- [ ] Install auth dependencies (bcrypt, jwt, cookies)
- [ ] Create User domain entity with validation
- [ ] Build AuthService with register/login logic
- [ ] Implement JWT service for token management
- [ ] Create auth API endpoints
- [ ] Add authenticate middleware

### Day 2: Frontend Auth Flow
- [ ] Install frontend auth dependencies
- [ ] Create auth page layouts and components
- [ ] Build AuthContext for state management
- [ ] Implement login/register forms
- [ ] Add protected route middleware
- [ ] Connect to backend auth endpoints
- [ ] Test full auth flow E2E

### Day 3: Usage Limits & Tracking
- [ ] Create UsageService for tracking
- [ ] Add usage check to upload flow
- [ ] Build usage counter component
- [ ] Implement credit reset logic
- [ ] Add upgrade prompts
- [ ] Test limit enforcement

### Day 4: Tier System & Payments
- [ ] Create tier upgrade logic
- [ ] Build MockStripeService
- [ ] Add billing endpoints
- [ ] Create pricing page UI
- [ ] Implement checkout flow
- [ ] Test upgrade journey

### Day 5: Dashboard & Settings
- [ ] Build user dashboard layout
- [ ] Create stats components
- [ ] Implement settings page
- [ ] Add user preferences
- [ ] Build account management
- [ ] Test user flows

### Day 6: Polish & Testing
- [ ] Add processing indicators
- [ ] Update navigation
- [ ] Write comprehensive tests
- [ ] Fix bugs and edge cases
- [ ] Update documentation
- [ ] Final E2E validation

## 📁 Files to Create/Modify

### Backend Structure
```
backend/src/
├── domain/
│   ├── entities/
│   │   └── User.ts                 [NEW]
│   └── services/
│       ├── AuthService.ts          [NEW]
│       └── UsageService.ts         [NEW]
├── application/
│   └── use-cases/
│       ├── RegisterUserUseCase.ts  [NEW]
│       ├── LoginUserUseCase.ts     [NEW]
│       ├── CheckUsageLimitUseCase.ts [NEW]
│       └── UpgradeUserTierUseCase.ts [NEW]
├── infrastructure/
│   ├── auth/
│   │   ├── JwtService.ts          [NEW]
│   │   └── PasswordService.ts     [NEW]
│   ├── payments/
│   │   └── MockStripeService.ts   [NEW]
│   └── persistence/
│       └── UserRepositoryImpl.ts   [NEW]
└── presentation/
    └── api/
        ├── routes/
        │   ├── auth.ts             [NEW]
        │   ├── billing.ts          [NEW]
        │   └── voiceNotes.ts       [MODIFY]
        └── middleware/
            ├── authenticate.ts      [NEW]
            ├── rateLimit.ts        [NEW]
            └── usageLimit.ts       [NEW]
```

### Frontend Structure
```
frontend/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx         [NEW]
│   │   ├── register/page.tsx      [NEW]
│   │   └── layout.tsx             [NEW]
│   ├── (dashboard)/
│   │   └── page.tsx               [MODIFY]
│   ├── settings/page.tsx          [NEW]
│   ├── billing/page.tsx           [NEW]
│   └── upgrade/page.tsx           [NEW]
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx          [NEW]
│   │   └── RegisterForm.tsx       [NEW]
│   ├── dashboard/
│   │   ├── StatsCard.tsx          [NEW]
│   │   └── RecentNotes.tsx        [NEW]
│   ├── billing/
│   │   ├── PricingCard.tsx        [NEW]
│   │   └── MockCheckout.tsx       [NEW]
│   └── UsageCounter.tsx           [NEW]
├── contexts/
│   └── AuthContext.tsx            [NEW]
├── hooks/
│   └── useAuth.ts                 [NEW]
├── lib/
│   └── api/
│       ├── auth.ts                [NEW]
│       └── billing.ts             [NEW]
└── middleware.ts                  [NEW]
```

## 🔧 Code Templates

### 1. Prisma Schema Updates
```prisma
// Add to backend/prisma/schema.prisma

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String
  tier              String    @default("free")
  creditsUsed       Int       @default(0)
  creditsResetDate  DateTime  @default(now())
  createdAt         DateTime  @default(now())
  lastLoginAt       DateTime?
  
  voiceNotes        VoiceNote[]
  sessions          Session[]
  usageLogs         UsageLog[]
  
  @@index([email])
  @@index([tier])
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
}

model UsageLog {
  id        String   @id @default(cuid())
  userId    String
  action    String
  timestamp DateTime @default(now())
  metadata  String?
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, timestamp])
}

// Update VoiceNote model
model VoiceNote {
  userId           String  // Change to proper foreign key
  user             User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... rest of fields
}
```

### 2. Auth Endpoints Template
```typescript
// backend/src/presentation/api/routes/auth.ts
import { FastifyPluginAsync } from 'fastify';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 }
        }
      }
    }
  }, async (request, reply) => {
    // Implementation
  });

  // Login
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    // Implementation
  });

  // Logout
  fastify.post('/logout', async (request, reply) => {
    // Clear cookie
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    // Return user data
  });
};
```

### 3. Frontend Auth Context
```typescript
// frontend/src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  tier: 'free' | 'pro' | 'business';
  creditsUsed: number;
  creditsLimit: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Implementation
  
  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 4. Usage Counter Component
```typescript
// frontend/src/components/UsageCounter.tsx
export function UsageCounter() {
  const { user } = useAuth();
  
  if (!user || user.tier !== 'free') return null;
  
  const remaining = 5 - user.creditsUsed;
  const percentage = (user.creditsUsed / 5) * 100;
  
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">Monthly Usage</span>
        <span className="text-sm font-medium">
          {user.creditsUsed} of 5 notes used
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {remaining <= 2 && (
        <p className="text-xs text-orange-600 mt-2">
          {remaining} upload{remaining !== 1 ? 's' : ''} remaining this month
        </p>
      )}
    </div>
  );
}
```

## 🧪 Test Scenarios

### Auth Tests
```typescript
describe('Authentication', () => {
  test('User can register with valid email/password');
  test('Duplicate email registration fails');
  test('Short password registration fails');
  test('User can login with correct credentials');
  test('Login fails with wrong password');
  test('JWT token is set in httpOnly cookie');
  test('Logout clears session');
});
```

### Usage Limit Tests
```typescript
describe('Usage Limits', () => {
  test('Free user can upload 5 notes');
  test('6th upload is blocked for free user');
  test('Pro user has unlimited uploads');
  test('Credits reset on month change');
  test('Failed processing doesnt count');
});
```

### Payment Tests
```typescript
describe('Mocked Payments', () => {
  test('Upgrade button shows when limit reached');
  test('Test card 4242... is accepted');
  test('User tier updates after payment');
  test('Subscription can be cancelled');
});
```

## 🔐 Security Checklist

- [ ] Passwords hashed with bcrypt (10 rounds)
- [ ] JWT stored in httpOnly cookie
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevented (React escaping)
- [ ] Sensitive data never logged
- [ ] Email validation on registration
- [ ] Password complexity enforced
- [ ] Session expiry implemented

## 📊 Monitoring Points

- Registration success/failure rate
- Login attempts and failures
- Average session duration
- Credit usage patterns
- Upgrade conversion points
- API response times
- Error rates by endpoint

## 🚀 Deployment Considerations

1. **Environment Variables**
   ```env
   JWT_SECRET=<strong-random-string>
   JWT_EXPIRES_IN=30d
   BCRYPT_ROUNDS=10
   STRIPE_PUBLIC_KEY=<mock-key>
   STRIPE_SECRET_KEY=<mock-key>
   ```

2. **Database Migrations**
   ```bash
   npx prisma migrate dev --name add-user-system
   npx prisma generate
   ```

3. **Docker Updates**
   - Add new env vars to docker-compose
   - Update volumes for session storage
   - Configure rate limit Redis (if used)

4. **Testing in Docker**
   ```bash
   docker compose up --build
   docker compose exec backend npm test
   docker compose exec frontend npm test
   ```

## 📝 Documentation Updates

- Update API documentation with auth endpoints
- Add user flow diagrams
- Document rate limits and tiers
- Create upgrade guide for users
- Update README with auth setup

This implementation guide provides the complete roadmap for adding the user system to nano-Grazynka!