# 🚀 Stackwise Beta Launch - Ready to Go!

Your app is ready for friends & family beta testing!

---

## ✅ What's Complete

### Phase 1: Beta Launch Features ✅

1. **✅ Enhanced Security**
   - Login rate limiting (5 attempts / 15min)
   - Registration rate limiting (3 accounts / hour)
   - Bcrypt password hashing (12 rounds)
   - JWT authentication
   - SQL injection protection

2. **✅ Auto-Pro for Beta Testers**
   - All new registrations get Pro automatically
   - Controlled by `BETA_MODE=true` in `.env`
   - Easy to disable when going public

3. **✅ Admin Management Tools**
   - View all users
   - Reset passwords
   - Upgrade/downgrade users manually
   - Delete test accounts
   - All via simple HTTP commands

4. **✅ CSV Import Feature**
   - Import bank statements from CSV
   - Supports Chase, BoA, Wells Fargo, CEFCU formats
   - Auto-format detection
   - Transaction matching ready

5. **✅ Complete Documentation**
   - Beta admin guide
   - Deployment guide (Railway + Vercel)
   - Security status & recommendations
   - CSV import guide
   - Stripe setup guide (for later)

---

## 📚 Documentation Quick Links

| Guide | Purpose | When to Use |
|-------|---------|-------------|
| **[BETA_ADMIN_GUIDE.md](BETA_ADMIN_GUIDE.md)** | Manage beta testers | Daily - reset passwords, view users |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | Deploy to web | Now - get your app online! |
| **[SECURITY_STATUS.md](SECURITY_STATUS.md)** | Security checklist | Review before & after launch |
| **[CSV_IMPORT_GUIDE.md](CSV_IMPORT_GUIDE.md)** | Help testers import CSVs | Share with beta testers |
| **[STRIPE_SETUP_GUIDE.md](STRIPE_SETUP_GUIDE.md)** | Setup payments | Later - when ready to charge |

---

## 🎯 Your Next Steps

### Step 1: Deploy to Web (30 min)

Follow **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**:

1. Deploy backend to Railway
2. Deploy frontend to Vercel
3. Connect them together
4. Test everything works

**Result**: Live URL to share with friends!

### Step 2: Change Admin Secret (5 min)

Generate a strong admin secret:

```powershell
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update in Railway environment variables
# ADMIN_SECRET=<your-generated-secret>
```

**Important**: Keep this secret safe! Anyone with it can manage all accounts.

### Step 3: Test with Yourself (1 day)

Before inviting others:

1. Register an account
2. Create accounts (checking/savings)
3. Import CSV transactions
4. Create stacks
5. Test transaction matching
6. Try all features

**Why**: Catch bugs before friends see them!

### Step 4: Invite 2-3 Close Friends (1 week)

Start small:

1. Send them the URL
2. Tell them: "Register with your email - you get Pro automatically!"
3. Ask for feedback
4. Monitor via admin commands

**Check on them**:
```powershell
# View all users
curl -X GET https://your-railway-url/api/admin/users `
  -H "X-Admin-Secret: your-secret"
```

### Step 5: Fix Bugs & Iterate (ongoing)

Based on feedback:
- Fix bugs
- Improve UX
- Add missing features
- Push to GitHub → auto-deploys!

### Step 6: Expand Beta Testing

When stable:
- Invite more friends & family
- Collect more feedback
- Refine the experience

### Step 7: Prepare for Public Launch

Follow **[SECURITY_STATUS.md](SECURITY_STATUS.md)** production checklist:
- Add email verification
- Add password reset flow
- Set up Stripe payments
- Turn off beta mode
- Professional error tracking

---

## 🔑 Admin Commands Quick Reference

All commands use: `https://your-railway-url.up.railway.app/api/admin`

**View all users**:
```powershell
curl -X GET https://your-url/api/admin/users `
  -H "X-Admin-Secret: your-secret"
```

**Reset password**:
```powershell
curl -X POST https://your-url/api/admin/reset-password `
  -H "X-Admin-Secret: your-secret" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"user@example.com\",\"newPassword\":\"NewPass123\"}'
```

**Give someone Pro** (if beta mode disabled):
```powershell
curl -X POST https://your-url/api/admin/subscription `
  -H "X-Admin-Secret: your-secret" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"user@example.com\",\"tier\":\"pro\"}'
```

**Delete test account**:
```powershell
curl -X DELETE https://your-url/api/admin/user `
  -H "X-Admin-Secret: your-secret" `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\"}'
```

See **[BETA_ADMIN_GUIDE.md](BETA_ADMIN_GUIDE.md)** for complete commands.

---

## 💡 Tips for Beta Testing

### Communication with Testers

**When inviting**:
> "Hey! I'm building a money management app called Stackwise. Would you be willing to test it? You'll get Pro access for free. Just register with your email at [URL] and let me know if you run into any issues!"

**When they register**:
> "Thanks for signing up! Since this is beta testing, all your data is test data only. Try importing a CSV bank statement to see how transaction matching works. Let me know what you think!"

**When they forget password**:
> "No problem! I reset it to `TempPass2024` - you can change it in Settings after logging in."

### What to Ask For

- Is anything confusing?
- Any bugs or errors?
- What features are missing?
- Would you actually use this?
- What would you pay for it?

### What to Track

**Weekly**:
- How many users registered?
- How many are active?
- Any common issues?
- Most requested features?

**Check logs**:
```powershell
# In Railway
# Click service → View Logs
# Look for errors or issues
```

---

## 🎨 Customization Ideas

Want to personalize before launch?

### Branding
- Update logo in `frontend/public/`
- Change colors in `frontend/tailwind.config.js`
- Update app name in titles/headers

### Features
- Add more stack icons
- Add more color options
- Customize transaction categories
- Add budget tracking

### Admin Panel
- Build a web UI for admin commands
- Add analytics dashboard
- User activity tracking

---

## 🔐 Security Reminders

### ✅ Safe for Beta
- Password hashing is strong
- Rate limiting prevents brute force
- User data is isolated
- Admin endpoints are protected

### ⚠️ Before Public Launch
- Add email verification
- Add password reset flow
- Enable JWT token expiration
- Set up error tracking
- Complete production security checklist

See **[SECURITY_STATUS.md](SECURITY_STATUS.md)** for full details.

---

## 🆘 Troubleshooting

### "Can't connect to backend"

**Check**:
- Is Railway service running?
- Is `VITE_API_URL` correct in Vercel?
- Does it end with `/api`?

### "Too many requests"

**Fix**: Rate limiting kicked in, wait 15 minutes

**Or**: Increase limits in `backend/src/routes/auth.routes.ts`

### "Unauthorized" on admin commands

**Check**:
- Is `X-Admin-Secret` header correct?
- Does it match Railway environment variable?

### CSV import fails

**Check**:
- Does CSV have Date, Description, Amount columns?
- Are dates in MM/DD/YYYY or YYYY-MM-DD format?
- See **[CSV_IMPORT_GUIDE.md](CSV_IMPORT_GUIDE.md)** for help

---

## 📊 Beta Success Metrics

Track these to know if you're ready for public launch:

✅ **10+ beta testers** registered and active
✅ **Each tester uses it 3+ times** (shows it's useful)
✅ **No critical bugs** reported in 2 weeks
✅ **90%+ positive feedback** on core features
✅ **Users say they'd pay** for it

When you hit these → Time for public launch! 🚀

---

## 🎉 You're Ready to Launch!

Everything is in place:

✅ Secure authentication
✅ Admin management tools
✅ CSV import for testing
✅ Auto-Pro for beta testers
✅ Easy deployment process
✅ Comprehensive documentation

**Next**: Follow **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** to get online!

---

## 📞 Support

**Having issues?**

1. Check the specific guide for your issue
2. Review Railway/Vercel logs
3. Try the troubleshooting section above
4. Check browser console for frontend errors

**Documentation**:
- **Admin**: [BETA_ADMIN_GUIDE.md](BETA_ADMIN_GUIDE.md)
- **Deploy**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Security**: [SECURITY_STATUS.md](SECURITY_STATUS.md)
- **CSV**: [CSV_IMPORT_GUIDE.md](CSV_IMPORT_GUIDE.md)

---

**Good luck with your beta launch! 🚀**

You've built something really cool. Now go share it with the world (or at least your friends and family)! 😄
