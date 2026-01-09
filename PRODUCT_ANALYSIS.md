# Stackwise - Product Analysis & Implementation Guide

**Generated**: January 2, 2026
**Status**: Phase 1 - MVP Complete, Phase 2 - Critical Features Needed

---

## Table of Contents
1. [What is Stackwise?](#what-is-stackwise)
2. [Why It's Worth Paying For](#why-its-worth-paying-for)
3. [Current Status](#current-status)
4. [Critical Edge Cases](#critical-edge-cases)
5. [Implementation Priority](#implementation-priority)
6. [Technical Architecture](#technical-architecture)

---

## What is Stackwise?

### Core Concept
Stackwise is a **digital envelope budgeting system** that helps people organize their money into purpose-specific "stacks" (virtual envelopes). Think of it like having multiple savings jars for different goals, but all within your bank account.

### How It Works
1. **Connect your bank** or create test accounts
2. **Create stacks** for goals: "Emergency Fund", "Car Insurance", "Vacation", "License Plate Sticker"
3. **Allocate money** from your available balance into each stack
4. **Track progress** toward each goal with visual progress bars
5. **Set up auto-allocation** (e.g., automatically save $100/week for vacation)

### Key Differentiator
Unlike traditional banking that shows one big number, Stackwise shows:
- **Traditional**: "$2,000 in checking"
- **Stackwise**: "$2,000 total, but $500 for rent, $300 for insurance, $200 truly available"

---

## Why It's Worth Paying For

### Value Propositions

#### 1. Prevents Lifestyle Inflation
- See exactly how much money is "spoken for" vs truly available
- Stops you from spending "future money" earmarked for bills

#### 2. Goal Visualization
- Visual progress bars make saving tangible and motivating
- Seeing "80% toward new laptop" is more powerful than just seeing "$800"

#### 3. Automated Discipline
- Set-and-forget auto-allocations build savings habits
- "Pay yourself first" for every goal

#### 4. Financial Clarity
- Traditional banking shows one big number
- Stackwise shows multiple priorities in one dashboard

#### 5. Multi-Goal Management
- Track 10+ goals simultaneously without spreadsheets
- See all your financial priorities in one dashboard

### Subscription Pricing Strategy
- **Free Tier**: 3 stacks, basic features
- **Pro Tier** ($4.99/mo): Unlimited stacks, auto-allocation, bank linking
- **Premium** ($9.99/mo): Analytics, spending tracking, goal forecasting, priority support

---

## Current Status

### ✅ What's Working (MVP Complete)

#### Backend - Fully Functional
- ✅ Stack CRUD operations (create, read, update, delete)
- ✅ Allocation/deallocation with transaction safety
- ✅ Auto-allocation cron job (runs hourly)
- ✅ Plaid bank integration (linking, balance sync)
- ✅ JWT authentication & authorization
- ✅ User settings & preferences system
- ✅ Transaction history (virtual + real)
- ✅ Dark mode support
- ✅ Atomic database transactions (no data corruption)

#### Frontend - Fully Functional
- ✅ Modern, responsive UI with Tailwind CSS
- ✅ Dashboard with account & stack management
- ✅ Transaction history with pagination
- ✅ Settings page (profile, preferences, security)
- ✅ Modal-based workflows
- ✅ Dark mode throughout
- ✅ Click-outside-to-close for all modals
- ✅ Password strength indicator
- ✅ Real-time validation

### ⚠️ What's Missing (Critical for Production)

#### High Priority - Must Have
1. **Stack Completion Workflow** - What happens when target is reached?
2. **Spending Tracking** - How to log real-world spending?
3. **Failed Auto-Allocation Notifications** - Users don't know when allocations fail
4. **Recurring Stack Support** - Annual expenses need to reset
5. **Manual Reset Functionality** - Allow stack reset without deletion

#### Medium Priority - Should Have
6. Input validation improvements (auto-allocation start date required)
7. Date calculator fix (end-of-month handling)
8. Stack archival (soft delete for history)
9. Multi-stack transfers
10. Stack locking/protection

#### Low Priority - Nice to Have
11. Advanced analytics dashboard
12. Goal projections
13. Stack templates
14. Category grouping
15. Behavioral insights

---

## Critical Edge Cases

### Edge Case 1: Stack Goal Completion

#### The Problem
You save $500 for a license plate sticker. Stack shows "100% complete!" But then what?
- No notification you reached your goal
- Stack just sits there forever
- You have to manually delete it
- No record you ever completed this goal

#### Clean Solution
```
Add a completion workflow:

When currentAmount >= targetAmount:
  ↓
Auto-mark stack as "COMPLETED"
  ↓
Show checkmark badge + "Goal Reached!" confetti animation
  ↓
User gets 3 options:
  ┌─────────────────────────────────────────┐
  │ 🎉 Goal Reached: License Plate Sticker │
  │                                         │
  │ You saved $500!                         │
  │                                         │
  │ ⚪ Keep saving (increase target)        │
  │ ⚪ Archive (keep for history)           │
  │ ⚪ Close & return funds to available    │
  └─────────────────────────────────────────┘
```

#### Implementation
```typescript
// Add to Stack model
isCompleted: boolean (default: false)
completedAt: DateTime?
completionAmount: Float?

// Auto-completion detection
if (stack.currentAmount >= stack.targetAmount && !stack.isCompleted) {
  await updateStack({
    isCompleted: true,
    completedAt: new Date(),
    completionAmount: stack.currentAmount
  });
  // Trigger notification/confetti
}
```

---

### Edge Case 2: Real-World Spending

#### The Problem
You saved $500 for car repair. You pay the mechanic with a credit card (not your checking account). Now:
- Stack still shows $500
- But you already spent it
- App doesn't know the money was used

#### Clean Solution
```
Add "Mark as Spent" button on each stack:

Stack Detail View:
  ┌──────────────────────────────────────┐
  │ 🚗 Car Repair Stack                  │
  │ Current: $500 / Target: $500 (100%)  │
  │                                      │
  │ [Remove Money]  [Mark as Spent]     │
  └──────────────────────────────────────┘

When clicked:
  ↓
Modal appears:
  ┌──────────────────────────────────────┐
  │ Log Spending                         │
  │                                      │
  │ Amount: [$500]                       │
  │ Method: ⚪ Cash  ⚪ Credit Card      │
  │ Note: [Paid Bob's Auto Shop]        │
  │                                      │
  │        [Cancel]  [Log Spending]      │
  └──────────────────────────────────────┘
```

#### Implementation
```typescript
// Add new transaction type
type: 'spending'

// Backend endpoint
POST /api/stacks/:id/logSpending
{
  amount: 500,
  method: 'credit_card',
  note: 'Paid Bob\'s Auto Shop'
}

// Logic
- Create transaction with type: 'spending'
- Decrement stack.currentAmount
- Keep money in account.availableBalance (paid externally)
- Record in transaction history
```

---

### Edge Case 3: Failed Auto-Allocation

#### The Problem
You set up $100/week auto-allocation for vacation. One week, your account only has $50. Auto-allocation silently fails. You discover weeks later you're short $400.

#### Clean Solution
```
Add notification system:

Dashboard shows banner:
  ┌──────────────────────────────────────────────────────┐
  │ ⚠️ Auto-allocation paused for "Vacation Fund"       │
  │ Reason: Insufficient funds ($50 available, $100 needed) │
  │                                                       │
  │ [Skip This Week]  [Allocate What's Available]        │
  └──────────────────────────────────────────────────────┘
```

#### Implementation
```typescript
// Add to Stack model
failedAllocations: number (default: 0)
lastFailureReason: string?
lastFailureDate: DateTime?
isAutoPaused: boolean (default: false)

// In autoAllocation.service.ts
if (insufficientFunds) {
  await updateStack({
    failedAllocations: stack.failedAllocations + 1,
    lastFailureReason: 'Insufficient funds',
    lastFailureDate: new Date(),
    isAutoPaused: stack.failedAllocations >= 2 // Pause after 2 failures
  });

  // Create notification
  await createNotification({
    userId: stack.account.userId,
    type: 'failed_allocation',
    stackId: stack.id,
    message: 'Auto-allocation failed due to insufficient funds'
  });
}
```

---

### Edge Case 4: Recurring Expenses

#### The Problem
You save $100/month for car insurance ($1,200/year). After 12 months, you pay the bill. Now you need to:
- Manually delete the stack
- Recreate it next year
- Lose all history

#### Clean Solution
```
Add "Recurring Stack" type:

When creating stack:
  ┌──────────────────────────────────────┐
  │ Stack Type:                          │
  │ ⚪ One-time goal (vacation, laptop)  │
  │ ⚪ Recurring expense (insurance)     │
  │                                      │
  │ If recurring:                        │
  │   Reset frequency: [Annually ▼]     │
  │   Auto-reset when: [Goal reached]   │
  └──────────────────────────────────────┘
```

#### Implementation
```typescript
// Add to Stack model
stackType: 'goal' | 'recurring' (default: 'goal')
recurringResetFrequency?: 'monthly' | 'quarterly' | 'annually'
resetOnCompletion: boolean (default: false)

// Auto-reset logic
if (stack.isCompleted && stack.stackType === 'recurring' && stack.resetOnCompletion) {
  await prisma.$transaction(async (tx) => {
    // Archive current state
    await tx.stackHistory.create({
      data: {
        stackId: stack.id,
        completedAmount: stack.currentAmount,
        completedAt: new Date()
      }
    });

    // Reset stack
    await tx.stack.update({
      where: { id: stack.id },
      data: {
        currentAmount: 0,
        isCompleted: false,
        completedAt: null
      }
    });
  });
}
```

---

### Edge Case 5: Manual Reset Button

#### The Problem
Stack is at 100%. User paid for the thing outside the app. They want to restart the stack for next time.

#### Clean Solution
```
Add "Reset Stack" button on completed stacks:

Stack dropdown menu (3 dots):
  ┌─────────────────────────────┐
  │ 👁️  View Details             │
  │ ✏️  Edit                     │
  │ 🔄 Reset to $0 (keep goal)  │
  │ 🗑️  Delete                   │
  └─────────────────────────────┘

When "Reset to $0" clicked:
  ↓
Confirmation modal:
  ┌──────────────────────────────────────┐
  │ Reset "License Plate Sticker"?       │
  │                                      │
  │ Current amount ($500) will move to:  │
  │ ⚪ Available balance                 │
  │ ⚪ Archive as spent (remove from bal)│
  │                                      │
  │ Stack will reset to $0 and remain    │
  │ active for next time.                │
  │                                      │
  │      [Cancel]  [Reset Stack]         │
  └──────────────────────────────────────┘
```

#### Implementation
```typescript
// Backend endpoint
POST /api/stacks/:id/reset
{
  action: 'return_to_available' | 'mark_as_spent'
}

// Logic
await prisma.$transaction(async (tx) => {
  if (action === 'return_to_available') {
    // Deallocate funds back to account
    await tx.account.update({
      where: { id: stack.accountId },
      data: { availableBalance: { increment: stack.currentAmount } }
    });

    await tx.transaction.create({
      data: {
        type: 'deallocation',
        amount: stack.currentAmount,
        description: `Reset "${stack.name}" - funds returned`
      }
    });
  } else {
    // Mark as spent (funds removed from system)
    await tx.transaction.create({
      data: {
        type: 'spending',
        amount: stack.currentAmount,
        description: `Reset "${stack.name}" - marked as spent`
      }
    });
  }

  // Reset stack
  await tx.stack.update({
    where: { id: stack.id },
    data: {
      currentAmount: 0,
      isCompleted: false,
      completedAt: null
    }
  });
});
```

---

## Implementation Priority

### Phase 1 (Immediate - 1-2 weeks) - Critical for Beta
**Time Estimate**: 15-20 hours

1. **Add completion workflow** (3-4 hours)
   - Add `isCompleted`, `completedAt`, `completionAmount` to Stack model
   - Auto-detect when target reached
   - Show confetti/badge on completion
   - Add "Archive" button

2. **Add auto-allocation failure notifications** (3-4 hours)
   - Add `failedAllocations`, `isAutoPaused` to Stack model
   - Dashboard banner for failures
   - Email notifications (if preferences enabled)

3. **Add spending tracking** (4-5 hours)
   - New transaction type: 'spending'
   - "Mark as Spent" button on stacks
   - Modal to log external spending
   - Transaction history shows spending

4. **Add input validation** (2-3 hours)
   - Require auto-allocation start date
   - Validate amounts (no negatives)
   - Max value checks

5. **Add manual reset functionality** (3-4 hours)
   - "Reset Stack" button
   - Confirmation modal with options
   - Backend endpoint

### Phase 2 (Short-term - 2-4 weeks) - Production Ready
**Time Estimate**: 25-30 hours

6. **Fix date calculator** (2-3 hours)
   - Handle end-of-month correctly
   - Fix monthly allocation drift

7. **Add recurring stack support** (5-6 hours)
   - `stackType` field ('goal' | 'recurring')
   - Auto-reset logic
   - Stack history model

8. **Add multi-stack transfers** (4-5 hours)
   - Transfer between stacks
   - UI for reallocation

9. **Add stack locking/protection** (3-4 hours)
   - Mark stacks as protected
   - Require confirmation to deallocate

10. **Add soft delete/archival** (4-5 hours)
    - Archive instead of delete
    - View archived stacks
    - Restore functionality

11. **Add notification system** (7-8 hours)
    - Notification model
    - In-app notification center
    - Email integration

### Phase 3 (Medium-term - 4-8 weeks) - Premium Features
**Time Estimate**: 40-50 hours

12. **Analytics dashboard** (10-12 hours)
13. **Goal projections** (6-8 hours)
14. **Stack templates** (5-6 hours)
15. **Category grouping** (6-8 hours)
16. **Advanced Plaid matching** (12-15 hours)

---

## Technical Architecture

### Database Schema

```prisma
// Current Schema
model Stack {
  id                     String   @id @default(uuid())
  accountId              String
  name                   String
  description            String?
  targetAmount           Float?
  currentAmount          Float    @default(0)
  color                  String
  icon                   String
  priority               Int
  isActive               Boolean  @default(true)
  autoAllocate           Boolean  @default(false)
  autoAllocateAmount     Float?
  autoAllocateFrequency  String?
  autoAllocateStartDate  DateTime?
  autoAllocateNextDate   DateTime?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}

// Needed Additions for Phase 1
model Stack {
  // ... existing fields ...

  // Completion tracking
  isCompleted            Boolean  @default(false)
  completedAt            DateTime?
  completionAmount       Float?

  // Failed allocation tracking
  failedAllocations      Int      @default(0)
  lastFailureReason      String?
  lastFailureDate        DateTime?
  isAutoPaused           Boolean  @default(false)

  // Recurring stacks
  stackType              String   @default("goal") // 'goal' or 'recurring'
  recurringResetFrequency String?
  resetOnCompletion      Boolean  @default(false)
}

// New Models for Phase 2
model StackHistory {
  id              String   @id @default(uuid())
  stackId         String
  completedAmount Float
  completedAt     DateTime
  createdAt       DateTime @default(now())

  stack Stack @relation(fields: [stackId], references: [id], onDelete: Cascade)
  @@index([stackId])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // 'failed_allocation', 'goal_reached', 'low_balance'
  title     String
  message   String
  stackId   String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, isRead])
}
```

### API Endpoints

#### New Endpoints Needed (Phase 1)
```typescript
// Stack completion
POST /api/stacks/:id/complete
POST /api/stacks/:id/archive

// Spending tracking
POST /api/stacks/:id/logSpending
{
  amount: number,
  method: 'cash' | 'credit_card' | 'debit_card',
  note?: string
}

// Stack reset
POST /api/stacks/:id/reset
{
  action: 'return_to_available' | 'mark_as_spent'
}

// Notifications
GET /api/notifications
POST /api/notifications/:id/markRead
```

#### New Endpoints Needed (Phase 2)
```typescript
// Multi-stack transfers
POST /api/stacks/transfer
{
  fromStackId: string,
  toStackId: string,
  amount: number
}

// Stack archival
GET /api/stacks/archived
POST /api/stacks/:id/restore

// Stack templates
GET /api/stack-templates
POST /api/stacks/fromTemplate/:templateId
```

---

## Frontend Components Needed

### Phase 1 Components

```typescript
// CompletionBanner.tsx
// Shows when stack reaches 100%
<CompletionBanner
  stack={stack}
  onArchive={handleArchive}
  onKeepSaving={handleKeepSaving}
  onClose={handleClose}
/>

// MarkSpentModal.tsx
// Log external spending
<MarkSpentModal
  stack={stack}
  onConfirm={handleLogSpending}
  onClose={handleClose}
/>

// ResetStackModal.tsx
// Reset stack to $0
<ResetStackModal
  stack={stack}
  onReset={handleReset}
  onClose={handleClose}
/>

// NotificationBanner.tsx
// Dashboard banner for failed allocations
<NotificationBanner
  notifications={failedAllocations}
  onDismiss={handleDismiss}
  onAction={handleAction}
/>
```

### Phase 2 Components

```typescript
// RecurringStackSettings.tsx
// Configure recurring behavior
<RecurringStackSettings
  stack={stack}
  onUpdate={handleUpdate}
/>

// TransferBetweenStacksModal.tsx
// Move money between stacks
<TransferBetweenStacksModal
  fromStack={stack1}
  toStack={stack2}
  onTransfer={handleTransfer}
  onClose={handleClose}
/>

// NotificationCenter.tsx
// In-app notification system
<NotificationCenter
  notifications={notifications}
  onMarkRead={handleMarkRead}
/>
```

---

## Code Quality Observations

### Strengths ✅
1. **Transaction safety**: All state-changing operations use Prisma transactions
2. **Authorization checks**: Every controller verifies `req.userId` matches resource owner
3. **Type safety**: Full TypeScript with proper typing
4. **Scheduled jobs**: Cron setup for auto-allocations
5. **Modern UI**: Clean, responsive design with dark mode

### Weaknesses ⚠️
1. **Validation gaps**: Missing checks for auto-allocation start date
2. **Race conditions**: No pessimistic locking on concurrent updates
3. **Soft deletes**: No archival - deleted stacks are gone forever
4. **Error handling**: Many failures silently logged, not surfaced to user
5. **Date bugs**: End-of-month allocation drift

---

## Production Readiness Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| Stack CRUD | ✓ Ready | Works correctly |
| Allocation/Deallocation | ✓ Ready | Transactional safety good |
| Auto-allocation | ⚠ Partial | Missing failure notifications |
| Bank integration | ⚠ Partial | Plaid link works, transfers simulated |
| Error handling | ✗ Not Ready | Silent failures, no user notifications |
| Input validation | ⚠ Partial | Missing checks for edge cases |
| Completion handling | ✗ Not Ready | No workflow for completed stacks |
| Spending tracking | ✗ Not Ready | Can't record real spending |
| Transaction history | ✓ Ready | Works, shows virtual + real |
| Multi-user safety | ✓ Ready | Proper auth/authorization |
| Data persistence | ✓ Ready | SQLite with transactions |
| Settings system | ✓ Ready | Profile, preferences, security |
| Dark mode | ✓ Ready | Fully supported |

---

## Simplest Path to Beta

If you can only implement **3 features** right now:

### 1. Mark as Spent (2-3 hours)
**Why**: Closes the loop between virtual allocation and real spending
- Most requested feature users will need
- Simple modal + backend endpoint
- Immediate value

### 2. Completion Detection + Archive (2-3 hours)
**Why**: Gives users closure on completed goals
- Auto-detect when stack reaches 100%
- Show confetti animation
- Archive instead of delete

### 3. Failed Auto-Allocation Notifications (3-4 hours)
**Why**: Prevents silent failures
- Dashboard banner when allocation fails
- "Pause" button to stop retries
- Email notification if enabled

**Total Time**: 7-10 hours
**Result**: App goes from 80% → 95% production-ready

---

## Conclusion

Stackwise has a **solid foundation** for envelope budgeting. The core allocation/deallocation logic is sound and transactional-safe. However, **critical gaps** exist for production use:

### Critical Gaps
1. **No completion workflow** - stacks hang around forever
2. **No spending tracking** - allocation is virtual, spending is unknown
3. **Silent failures** - auto-allocation failures not surfaced to user
4. **Date calculation bugs** - monthly allocations drift
5. **No notifications** - users must check manually

### Ready For
- ✅ **Beta testing** after Phase 1 (1-2 weeks)
- ✅ **Public release** after Phase 1 + 2 (3-6 weeks)
- ✅ **Premium launch** after Phase 3 (2-3 months)

### Technical Health
The architecture is clean and scalable. The main challenge is **UX/workflow** around completion and spending, not technical debt. The codebase is well-organized and ready for these enhancements.

---

## Quick Reference

### Key Files to Modify (Phase 1)

**Backend**:
- `backend/prisma/schema.prisma` - Add Stack fields
- `backend/src/controllers/stack.controller.ts` - Add new endpoints
- `backend/src/services/autoAllocation.service.ts` - Add failure tracking

**Frontend**:
- `frontend/src/components/StackCard.tsx` - Add completion badge
- `frontend/src/components/StackDetailModal.tsx` - Add "Mark as Spent" button
- `frontend/src/pages/DashboardPage.tsx` - Add notification banner
- Create new modals (MarkSpentModal, ResetStackModal, etc.)

### Testing Scenarios

1. **Completion Test**: Create stack with $100 target, allocate $100, verify completion badge
2. **Spending Test**: Mark $50 as spent, verify stack balance decreases
3. **Reset Test**: Reset stack to $0, verify funds return to available
4. **Failed Allocation**: Set auto-allocation > available balance, verify notification
5. **Recurring Test**: Create recurring stack, complete, verify auto-reset

---

**End of Document**

*For questions or implementation support, refer to the detailed implementation sections above.*
