# Negative Balance Handling Feature

## Overview

The Negative Balance Handling feature automatically manages situations where your available account balance goes below zero due to external payments that the app doesn't know about. This typically happens when you make a payment outside the app, and the bank sync detects a lower balance than expected.

## How It Works

### When Does It Trigger?

The feature activates during bank account synchronization when:
1. The app fetches your real bank balance from Plaid
2. It calculates your available balance: `balance - total_allocated_in_stacks`
3. The available balance is negative (less than 0)

### User Settings

Users can choose from three different behaviors in **Settings → Preferences → Account Behavior**:

#### 1. **Automatically take money from my stacks** (Recommended - Default)

- **Behavior**: `auto_deallocate`
- **What happens**: The app automatically removes money from your lowest priority stacks first to bring your available balance back to zero or positive
- **Child-friendly explanation**: "We'll remove money from your lowest priority stacks first to balance things out. It's like the app is helping you cover the payment."
- **Example**:
  - Available balance: -$100
  - Stack priorities: Emergency Fund (1), Vacation (2), Shopping (3)
  - Result: Takes $100 from Shopping stack (priority 3) first

#### 2. **Just tell me about it**

- **Behavior**: `notify_only`
- **What happens**: No automatic changes are made. The user receives a friendly notification explaining the situation
- **Child-friendly explanation**: "You'll get a friendly message explaining what happened, and you can fix it yourself by moving money around or matching the payment to a stack."
- **Use case**: Users who want full control and prefer to manually manage their stacks

#### 3. **Allow negative balance**

- **Behavior**: `allow_negative`
- **What happens**: Your available balance can go negative. The app displays the negative number but takes no automatic action
- **Child-friendly explanation**: "Your available balance can go negative. You'll see the negative number, but nothing else happens automatically."
- **Use case**: Users who understand their banking situation and don't need intervention

## Technical Implementation

### Database Schema

Added to `UserPreferences` model:
```prisma
negativeBalanceBehavior  String   @default("auto_deallocate")  // "auto_deallocate" | "allow_negative" | "notify_only"
```

### Backend Service

**File**: `backend/src/services/negativeBalance.service.ts`

**Key Methods**:
- `handleNegativeBalance(accountId, userId, negativeAmount)`: Main entry point
- `autoDeallocate(accountId, amountNeeded)`: Implements priority-based deallocation
- `createNotification(userId, accountId, result)`: Creates user notifications (placeholder)

**Deallocation Logic**:
1. Fetch all active stacks for the account
2. Order by priority **descending** (highest number = lowest priority)
3. Take money from lowest priority stacks first
4. Continue until available balance is zero or positive (or run out of stack money)
5. Create transaction records for each deallocation
6. Update account's available balance

### Integration Points

#### Plaid Sync Controller
**File**: `backend/src/controllers/plaid.controller.ts` (lines 310-327)

When syncing an account:
```typescript
const newAvailableBalance = newBalance - totalAllocated;

if (newAvailableBalance < 0) {
  const result = await negativeBalanceService.handleNegativeBalance(
    stackwiseAccount.id,
    req.userId!,
    newAvailableBalance
  );

  await negativeBalanceService.createNotification(
    req.userId!,
    stackwiseAccount.id,
    result
  );
}
```

#### User Preferences API
**File**: `backend/src/controllers/user.controller.ts`

Endpoints:
- `GET /api/user/preferences` - Fetch user preferences (includes negativeBalanceBehavior)
- `PUT /api/user/preferences` - Update user preferences (accepts negativeBalanceBehavior)

### Frontend Implementation

#### Settings UI
**File**: `frontend/src/components/settings/PreferencesSettings.tsx`

Features:
- Three radio button options with clear explanations
- Visual styling shows selected option
- Child-friendly language
- Save button with change detection

#### Type Definitions
**File**: `frontend/src/types/index.ts`

```typescript
export interface UserPreferences {
  // ... other fields ...
  negativeBalanceBehavior: 'auto_deallocate' | 'allow_negative' | 'notify_only';
}
```

## Testing

### Test Script
**File**: `backend/src/scripts/testNegativeBalance.ts`

Run with:
```bash
cd backend && npx tsx src/scripts/testNegativeBalance.ts
```

**Test Coverage**:
1. ✅ Auto-deallocate: Removes money from lowest priority stacks
2. ✅ Notify-only: Returns notification without modifying stacks
3. ✅ Allow-negative: Allows negative balance without action

### Example Test Output

```
--- Test 1: Auto-Deallocate Behavior ---
Simulating negative available balance: $-100
Result: {
  handled: true,
  behavior: 'auto_deallocate',
  deallocatedStacks: [
    { stackId: 'stack-3', stackName: 'Low Priority Stack', amount: 50 },
    { stackId: 'stack-2', stackName: 'Medium Priority Stack', amount: 50 }
  ],
  message: 'Successfully deallocated from 2 stack(s) to cover deficit'
}
```

## User Flow Example

### Scenario: User Makes External Payment

1. **Initial State**:
   - Bank balance: $1000
   - Stack allocations: $300
   - Available balance: $700

2. **User makes payment of $800 at store** (not through app)

3. **Bank sync occurs**:
   - New bank balance: $200 (1000 - 800)
   - Stack allocations: $300 (unchanged)
   - Available balance: -$100 (200 - 300) ❌ NEGATIVE!

4. **App Response** (depends on user setting):

   **If auto_deallocate**:
   - App finds lowest priority stack (e.g., "Shopping" with $150)
   - Takes $100 from Shopping stack
   - Shopping stack: $150 → $50
   - Available balance: -$100 → $0 ✅
   - User sees notification: "We moved $100 from your Shopping stack to cover a payment"

   **If notify_only**:
   - No automatic changes
   - User sees notification: "Your available balance is -$100. You may need to remove money from your stacks or match this payment to a stack."

   **If allow_negative**:
   - Available balance stays at -$100
   - No notification
   - User can see the negative balance in the UI

## Future Enhancements

1. **Smart Notifications**: Implement actual notification system in UI
2. **Notification History**: Store and display past negative balance events
3. **Transaction Matching**: Help users match external payments to specific stacks
4. **Predictive Warnings**: Warn users before auto-deallocation occurs
5. **Partial Stack Protection**: Allow users to "protect" certain stacks from auto-deallocation
6. **Undo Functionality**: Allow users to undo recent auto-deallocations

## Files Changed

### Backend
- `backend/prisma/schema.prisma` - Added negativeBalanceBehavior field
- `backend/src/services/negativeBalance.service.ts` - NEW: Core logic
- `backend/src/controllers/plaid.controller.ts` - Integrated negative balance handling
- `backend/src/controllers/user.controller.ts` - Added negativeBalanceBehavior to preferences API
- `backend/src/scripts/testNegativeBalance.ts` - NEW: Test script

### Frontend
- `frontend/src/types/index.ts` - Added UserPreferences interface
- `frontend/src/components/settings/PreferencesSettings.tsx` - Added UI for setting

## Summary

The Negative Balance Handling feature provides three flexible approaches to managing situations where account balances go negative due to external payments:

1. **Automatic** (default): Let the app handle it by removing money from low-priority stacks
2. **Notification**: Get notified and handle it manually
3. **Allow**: Accept negative balances without intervention

This gives users control while providing smart defaults that handle common scenarios automatically.
