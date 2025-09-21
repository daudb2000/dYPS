# DYPS Deployment Guide

This guide walks through deploying the DYPS website to Railway with the dyps.uk domain.

## Prerequisites

1. Railway account
2. Domain ownership of dyps.uk
3. Gmail app password for email functionality

## Quick Deployment Steps

### 1. Railway Setup

1. Go to [Railway.app](https://railway.app) and create a new project
2. Connect your GitHub repository
3. Railway will automatically detect the Dockerfile and deploy

### 2. Environment Variables

Set these environment variables in Railway:

```bash
NODE_ENV=production
PORT=3002
SESSION_SECRET=your-super-secure-session-secret-key-change-this-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
EMAIL_USER=daud@dyps.uk
EMAIL_PASSWORD=zojwlmzyilvrdrmc
DOMAIN=dyps.uk
```

### 3. Domain Configuration

1. In Railway project settings, go to "Domains"
2. Add custom domain: `dyps.uk` and `www.dyps.uk`
3. Update DNS records at your domain provider:
   - A record: `@` → Railway IP
   - CNAME record: `www` → Railway domain

### 4. Security Checklist

**CRITICAL: Change these before deployment:**

- [ ] `SESSION_SECRET` - Generate a secure random string
- [ ] `ADMIN_PASSWORD` - Use a strong password
- [ ] Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct
- [ ] Remove any test environment variables

### 5. Email Configuration

The app uses Gmail SMTP. Ensure:
- Gmail 2FA is enabled
- App password is generated for the Gmail account
- Email recipients are correct in the code (daud@dyps.uk, alkesh@dyps.uk, max@dyps.uk)

## Features

✅ **Responsive landing page** with membership application form
✅ **Admin dashboard** for reviewing applications
✅ **Email notifications** sent to DYPS team
✅ **Application status tracking** with backlog view
✅ **Security hardened** for production deployment

## Admin Access

- Login URL: `https://dyps.uk/admin/login`
- Default credentials: admin/admin123 (CHANGE IN PRODUCTION!)
- Features: Accept/reject applications, view backlog

## Support

The application includes:
- Dockerized deployment
- Health checks
- Production security settings
- HTTPS enforcement
- Session management
- Input validation

## Monitoring

Check these endpoints for health:
- Main site: `https://dyps.uk`
- Admin panel: `https://dyps.uk/admin/login`
- Health check: Railway provides built-in monitoring

## Troubleshooting

**Common issues:**

1. **Build failures**: Check that all dependencies are in package.json
2. **Email not sending**: Verify Gmail app password and 2FA setup
3. **Admin login fails**: Check ADMIN_USERNAME and ADMIN_PASSWORD env vars
4. **Domain not working**: Verify DNS records and Railway domain settings

**Logs**: Use Railway dashboard to view application logs and debug issues.# Railway deployment trigger Sun Sep 21 18:26:16 BST 2025
