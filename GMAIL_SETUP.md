# Gmail Setup for DYPS Email Service

## ✅ Gmail SMTP Now Implemented!

The email service has been updated to use Gmail SMTP instead of EmailJS. Follow these steps to enable email delivery:

## Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the setup process to enable 2FA (required for app passwords)

## Step 2: Generate Gmail App Password

1. In Google Account Settings → **Security**
2. Under "2-Step Verification", click **App passwords**
3. Select **Mail** as the app
4. Select **Other (custom name)** as the device
5. Enter "DYPS Website" or similar
6. Click **Generate**
7. **Copy the 16-character app password** (looks like: `abcd efgh ijkl mnop`)

## Step 3: Set Railway Environment Variables

In your Railway project dashboard, add these environment variables:

```bash
EMAIL_USER=daud@dyps.uk
EMAIL_PASSWORD=your-16-character-app-password
ADMIN_EMAIL=daud@dyps.uk,alkesh@dyps.uk,max@dyps.uk
```

**Important Notes:**
- Use your Gmail address for `EMAIL_USER`
- Use the 16-character app password (NOT your regular Gmail password)
- `ADMIN_EMAIL` can be multiple addresses separated by commas

## Step 4: Test the Setup

1. Deploy to Railway (it will auto-deploy from your GitHub push)
2. Submit a test membership application
3. Check Railway logs to see if email was sent successfully
4. Check the recipient email inboxes for the notification

## Expected Behavior

✅ **With Gmail configured**: Emails will be sent via Gmail SMTP
❌ **Without Gmail configured**: Emails will be logged to Railway logs only

## Troubleshooting

### "Gmail SMTP test failed" errors:
- Verify 2FA is enabled on your Gmail account
- Double-check the app password is correct (16 characters, no spaces)
- Make sure `EMAIL_USER` is the correct Gmail address
- Try generating a new app password

### "Authentication failed" errors:
- The app password might be incorrect
- Make sure you're using the app password, not your regular Gmail password
- Check that the Gmail account has 2FA enabled

### Emails not arriving:
- Check spam/junk folders
- Verify `ADMIN_EMAIL` addresses are correct
- Check Railway logs for any delivery errors

## Email Template Preview

The emails will include:
- 📧 Professional HTML formatting
- 👤 Complete applicant details (name, company, role, email, LinkedIn)
- 📅 Submission timestamp
- 🔗 Direct link to admin dashboard
- 🎯 Clear call-to-action for reviewing applications

## Security Notes

- App passwords are more secure than using your regular Gmail password
- Railway environment variables are encrypted and secure
- Never commit email credentials to your code repository
- Each app password is unique and can be revoked individually

Your email service is now production-ready! 🚀