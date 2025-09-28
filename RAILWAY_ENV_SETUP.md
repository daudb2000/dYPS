# 🚀 Railway Environment Variables Setup

## Required Environment Variables for Production

### **Core Application Settings**
```bash
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-super-secure-session-secret-key-change-this-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
```

### **Email Configuration**
```bash
ADMIN_EMAIL=daud@dyps.uk,alkesh@dyps.uk,max@dyps.uk

# Resend API (PRIMARY - CONFIGURED ✅)
RESEND_API_KEY=re_iia5dGev_HCmrVPSHoeC1izrNBpd1tfgs
RESEND_FROM_EMAIL=DYPS <noreply@dyps.uk>

# SendGrid API (OPTIONAL - Enterprise backup)
SENDGRID_API_KEY=SG.your_sendgrid_key_here
SENDGRID_FROM_EMAIL=noreply@dyps.uk

# Gmail SMTP (OPTIONAL - Development backup)
EMAIL_USER=your-email@dyps.uk
EMAIL_PASSWORD=your-gmail-app-password

# Formspree (FREE BACKUP - Keep for redundancy)
FORMSPREE_ENDPOINT=https://formspree.io/f/mzzjprzq
```

### **Domain Configuration**
```bash
DOMAIN=dyps.uk
REPLIT_DEV_DOMAIN=https://dyps.up.railway.app
```

## How to Set These in Railway:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add each variable above (one by one)
5. Deploy your changes

## Priority Order (Production):
1. **Resend API** ✅ (Premium, high deliverability)
2. **SendGrid API** (Enterprise backup)
3. **Formspree** (Free backup - 50 emails/month)
4. **Gmail SMTP** (Development backup)
5. **Logging Fallback** (Always available)