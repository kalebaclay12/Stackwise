# Admin Testing Guide

This guide explains how to manually upgrade users to Pro tier for testing purposes (friends, family, beta testers).

## Prerequisites

- You need the `ADMIN_SECRET` from the backend `.env` file
- Default value: `stackwise-admin-2024-change-this`
- **IMPORTANT**: Change this secret in production!

## Admin Endpoints

All admin endpoints require the `X-Admin-Secret` header.

### 1. Upgrade User to Pro Tier

**Endpoint**: `POST http://localhost:5000/api/admin/subscription`

**Headers**:
```
Content-Type: application/json
X-Admin-Secret: stackwise-admin-2024-change-this
```

**Body (Permanent Pro)**:
```json
{
  "email": "friend@example.com",
  "tier": "pro"
}
```

**Body (Temporary Pro - 30 days)**:
```json
{
  "email": "friend@example.com",
  "tier": "pro",
  "expiresInDays": 30
}
```

**Example using curl**:
```bash
curl -X POST http://localhost:5000/api/admin/subscription \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" \
  -d '{
    "email": "friend@example.com",
    "tier": "pro",
    "expiresInDays": 30
  }'
```

**Example using PowerShell**:
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "X-Admin-Secret" = "stackwise-admin-2024-change-this"
}

$body = @{
    email = "friend@example.com"
    tier = "pro"
    expiresInDays = 30
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/admin/subscription" -Method Post -Headers $headers -Body $body
```

### 2. Downgrade User to Free Tier

**Body**:
```json
{
  "email": "friend@example.com",
  "tier": "free"
}
```

### 3. List All Users

**Endpoint**: `GET http://localhost:5000/api/admin/users`

**Headers**:
```
X-Admin-Secret: stackwise-admin-2024-change-this
```

**Example**:
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "X-Admin-Secret: stackwise-admin-2024-change-this"
```

## Common Testing Scenarios

### Give Friend 30-Day Pro Access
```json
{
  "email": "friend@example.com",
  "tier": "pro",
  "expiresInDays": 30
}
```

### Give Family Member Permanent Pro
```json
{
  "email": "family@example.com",
  "tier": "pro"
}
```

### Give Beta Tester 90-Day Access
```json
{
  "email": "betatester@example.com",
  "tier": "pro",
  "expiresInDays": 90
}
```

## Security Notes

1. **Never share the ADMIN_SECRET publicly**
2. **Change the default secret** in production
3. This is a temporary solution for testing
4. In production, consider:
   - IP whitelisting for admin endpoints
   - Proper role-based access control (RBAC)
   - Audit logging for all admin actions
   - Rate limiting on admin endpoints

## Checking User Status

Users can check their subscription status in:
1. **Settings Page** → Subscription tab
2. The subscription badge will appear in the navigation
3. Stack creation will show their tier limits

## Expiration Behavior

When a temporary Pro subscription expires:
- User automatically downgrades to Free tier
- Their stacks remain (even if > 3)
- They cannot create new stacks if they have 3+
- Auto-allocation stops working
- Bank linking features are disabled

## Testing Workflow

1. **Create test accounts** or use existing ones
2. **Upgrade to Pro** using admin endpoint
3. **Test Pro features**:
   - Create unlimited stacks
   - Enable auto-allocation
   - Link bank accounts (if Plaid is configured)
4. **Downgrade to Free** to test limitations
5. **Verify UI** shows correct tier badges and restrictions
