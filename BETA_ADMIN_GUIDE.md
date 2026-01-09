# Beta Admin Guide - Stackwise

Easy commands to manage your beta testers. All commands use your admin secret for security.

## Quick Reference

**Your Admin Secret**: `stackwise-admin-2024-change-this` (change this before going live!)

**Base URL** (local): `http://localhost:5000/api/admin`
**Base URL** (production): `https://your-backend-url.com/api/admin`

---

## 🎉 Beta Mode Features

### Auto-Pro for All New Users

**Status**: ✅ ENABLED

All new user registrations automatically get Pro tier! This is controlled by `BETA_MODE=true` in your `.env` file.

**To disable** (when you go public):
```bash
# In backend/.env
BETA_MODE=false
```

---

## 📋 Admin Commands (PowerShell)

### 1. View All Users

See everyone who's registered and their subscription status:

```powershell
curl -X GET http://localhost:5000/api/admin/users `
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" `
  -H "Content-Type: application/json"
```

**Response**:
```json
[
  {
    "id": "user-id",
    "email": "friend@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "subscriptionTier": "pro",
    "subscriptionStatus": "active",
    "subscriptionExpiresAt": null,
    "createdAt": "2026-01-07T..."
  }
]
```

---

### 2. Reset Someone's Password

If a beta tester forgets their password:

```powershell
curl -X POST http://localhost:5000/api/admin/reset-password `
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"friend@example.com\",\"newPassword\":\"newpassword123\"}'
```

**Response**:
```json
{
  "message": "Password successfully reset for friend@example.com",
  "email": "friend@example.com"
}
```

Then tell your friend: "Your new password is `newpassword123` - please change it after logging in"

---

### 3. Manually Upgrade Someone to Pro

If beta mode is off and you want to give someone Pro:

```powershell
curl -X POST http://localhost:5000/api/admin/subscription `
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"friend@example.com\",\"tier\":\"pro\"}'
```

**With expiration** (e.g., 30-day trial):
```powershell
curl -X POST http://localhost:5000/api/admin/subscription `
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"friend@example.com\",\"tier\":\"pro\",\"expiresInDays\":30}'
```

---

### 4. Downgrade Someone to Free

```powershell
curl -X POST http://localhost:5000/api/admin/subscription `
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"friend@example.com\",\"tier\":\"free\"}'
```

---

### 5. Delete a Test Account

Clean up test accounts or remove a user:

```powershell
curl -X DELETE http://localhost:5000/api/admin/user `
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\"}'
```

**⚠️ WARNING**: This permanently deletes:
- User account
- All accounts (checking/savings)
- All stacks
- All transactions
- All preferences
- All notifications

---

## 🔒 Security Features

### Rate Limiting

✅ **Login Protection**: 5 attempts per 15 minutes per IP
- Prevents brute force attacks
- Automatically unlocks after 15 minutes

✅ **Registration Protection**: 3 registrations per hour per IP
- Prevents spam account creation
- Good enough for beta, can be adjusted

### Password Security

✅ **Bcrypt Hashing**: All passwords hashed with 12 rounds
✅ **Minimum 8 Characters**: Enforced on registration and reset
✅ **No Plain Text Storage**: Passwords never stored in plain text

### API Security

✅ **JWT Tokens**: Secure authentication tokens
✅ **Admin Secret Required**: All admin endpoints protected
✅ **Input Validation**: Zod schema validation on all inputs
✅ **SQL Injection Protection**: Prisma ORM prevents SQL injection

---

## 🧪 Beta Testing Workflow

### Inviting Beta Testers

1. **Send them the app URL**: `https://your-app-url.com`
2. **Tell them to register** with their email
3. **They automatically get Pro** (because `BETA_MODE=true`)
4. **Monitor via** `GET /api/admin/users`

### If They Forget Password

1. **Run password reset command** (see #2 above)
2. **Send them new temporary password** via text/email
3. **Tell them to change it** in Settings after logging in

### Managing Accounts

**View all testers**:
```powershell
curl -X GET http://localhost:5000/api/admin/users `
  -H "X-Admin-Secret: stackwise-admin-2024-change-this"
```

**Check who's active** - Look at `createdAt` timestamps to see recent signups

---

## 📝 Common Scenarios

### Scenario 1: Friend Forgot Password

```powershell
# Reset password to temporary one
curl -X POST http://localhost:5000/api/admin/reset-password `
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"friend@email.com\",\"newPassword\":\"TempPass2024\"}'

# Text them: "Password reset to TempPass2024"
```

### Scenario 2: Someone Registered by Accident

```powershell
# Delete their account
curl -X DELETE http://localhost:5000/api/admin/user `
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"accident@email.com\"}'
```

### Scenario 3: Give Extended Pro Access

```powershell
# Give Pro for 90 days
curl -X POST http://localhost:5000/api/admin/subscription `
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"friend@email.com\",\"tier\":\"pro\",\"expiresInDays\":90}'
```

### Scenario 4: Check All Beta Testers

```powershell
# Get full list
curl -X GET http://localhost:5000/api/admin/users `
  -H "X-Admin-Secret: stackwise-admin-2024-change-this" | ConvertFrom-Json | Format-Table
```

---

## 🚀 Before Going Public

When you're ready to launch publicly and start charging:

1. **Turn off Beta Mode**:
   ```bash
   # In backend/.env
   BETA_MODE=false
   ```

2. **Change Admin Secret**:
   ```bash
   # In backend/.env
   ADMIN_SECRET="your-super-secret-key-here"
   ```

3. **Set up Stripe**:
   - Follow [STRIPE_SETUP_GUIDE.md](STRIPE_SETUP_GUIDE.md)
   - Add real Stripe keys to `.env`

4. **Existing Beta Testers**:
   - They keep their Pro status!
   - Set expiration dates if you want:
     ```powershell
     curl -X POST http://localhost:5000/api/admin/subscription `
       -H "X-Admin-Secret: your-new-secret" `
       -H "Content-Type: application/json" `
       -d '{\"email\":\"beta-tester@email.com\",\"tier\":\"pro\",\"expiresInDays\":365}'
     ```

5. **New Users** (after `BETA_MODE=false`):
   - Start on Free tier
   - Must upgrade via Stripe to get Pro

---

## 💡 Tips

**Keep track of beta testers**:
- Run `GET /api/admin/users` weekly
- Save the output to track who's active
- Look at `createdAt` dates to see signup trends

**Password resets**:
- Use memorable temporary passwords like `WelcomeBack2024`
- Tell them to change it immediately

**Clean up after beta**:
- Delete test accounts before going live
- Review all users and their subscription status

**Security**:
- **NEVER share your admin secret** publicly
- Change it before deployment
- Use a strong secret in production (50+ random characters)

---

## 🆘 Troubleshooting

**"Unauthorized" error**:
- Check that `X-Admin-Secret` header matches `.env` file
- Make sure header is spelled correctly (case-sensitive)

**"User not found"**:
- Verify email address is correct
- Check with `GET /api/admin/users` to see all registered users

**"Too many requests"**:
- Rate limiting kicked in
- Wait 15 minutes for login attempts
- Wait 1 hour for registration attempts

**Can't access admin endpoints**:
- Verify backend server is running
- Check URL is correct (localhost:5000 vs production URL)
- Ensure admin routes are loaded (check backend logs)

---

## 📞 Quick Commands Cheat Sheet

```powershell
# View all users
curl -X GET http://localhost:5000/api/admin/users -H "X-Admin-Secret: stackwise-admin-2024-change-this"

# Reset password
curl -X POST http://localhost:5000/api/admin/reset-password -H "X-Admin-Secret: stackwise-admin-2024-change-this" -H "Content-Type: application/json" -d '{\"email\":\"EMAIL\",\"newPassword\":\"NEWPASS\"}'

# Upgrade to Pro
curl -X POST http://localhost:5000/api/admin/subscription -H "X-Admin-Secret: stackwise-admin-2024-change-this" -H "Content-Type: application/json" -d '{\"email\":\"EMAIL\",\"tier\":\"pro\"}'

# Downgrade to Free
curl -X POST http://localhost:5000/api/admin/subscription -H "X-Admin-Secret: stackwise-admin-2024-change-this" -H "Content-Type: application/json" -d '{\"email\":\"EMAIL\",\"tier\":\"free\"}'

# Delete user
curl -X DELETE http://localhost:5000/api/admin/user -H "X-Admin-Secret: stackwise-admin-2024-change-this" -H "Content-Type: application/json" -d '{\"email\":\"EMAIL\"}'
```

**Replace**:
- `EMAIL` with actual email address
- `NEWPASS` with temporary password
- `stackwise-admin-2024-change-this` with your actual admin secret
- `http://localhost:5000` with your production URL when deployed

---

That's it! You now have full control over your beta testing environment. 🎉
