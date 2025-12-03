# Deployment Guide

## First Time Setup

### 1. Configure Git Identity (One-time setup)

Run these commands in PowerShell or Git Bash:

```powershell
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

Replace with your actual GitHub email and name.

## Deploying Changes

### Option 1: Use the PowerShell Script (Recommended)

Simply run:

```powershell
.\deploy.ps1
```

This script will:
- ✅ Automatically update the cache version to today's date
- ✅ Stage all your changes
- ✅ Commit with a descriptive message
- ✅ Push to GitHub Pages

### Option 2: Manual Deployment

1. **Update the cache version** in `service-worker.js`:
   - Change `BUILD_DATE` to today's date (YYYYMMDD format)
   - Example: `const BUILD_DATE = '20251203';`

2. **Commit and push**:
   ```powershell
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

## After Deployment

- GitHub Pages usually updates within 1-2 minutes
- Users will automatically get the update (thanks to network-first strategy)
- If users don't see updates, they can:
  - Hard refresh (Ctrl+F5 or Cmd+Shift+R)
  - Clear site data in browser settings
  - Reinstall the PWA

## Troubleshooting

**"Author identity unknown" error:**
- Run the git config commands from the First Time Setup section

**"Permission denied" error:**
- Make sure you have push access to the repository
- Check your GitHub authentication (SSH keys or personal access token)

**Changes not showing on site:**
- Wait 2-3 minutes for GitHub Pages to rebuild
- Clear your browser cache
- Check the GitHub Pages settings in your repository

