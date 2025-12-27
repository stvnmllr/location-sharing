# Deployment Guide - Render.com

## Prerequisites

1. GitHub account (or Git repository)
2. Render.com account

**Note**: No API keys needed! OpenStreetMap is free and doesn't require authentication.

## Step 1: Push Code to GitHub

```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create repository on GitHub, then:
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Step 2: Deploy on Render.com

### Option A: Single Web Service (Recommended)

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: thebrain (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: main (or your default branch)
   - **Root Directory**: (leave empty - root of repo)
   - **Runtime**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node server.js`
5. Add Environment Variables (optional):
   - `NODE_ENV`: `production` (optional, good practice)
   - No API keys needed!
6. Click "Create Web Service"

### Option B: Separate Static Site (Alternative)

If you want to separate frontend and backend:

**Backend Service:**
- Follow Option A but set Root Directory to `server`
- Build Command: `npm install`
- Start Command: `node server.js`

**Static Site (Frontend):**
1. Click "New +" → "Static Site"
2. Configure:
   - **Name**: thebrain-frontend
   - **Root Directory**: public
   - **Build Command**: (leave empty or `echo "No build needed"`)
   - **Publish Directory**: public

**Note**: With Option B, you'll need to update the Socket.io URL in `app.js` to point to your backend service URL.

## Step 3: Update Frontend Configuration (if needed)

For Option B (separate services), update the Socket.io connection URL in `public/app.js`:

```javascript
// For Option A (single service):
const SOCKET_URL = window.location.origin; // This should work automatically

// For Option B (separate services):
const SOCKET_URL = 'https://your-backend-service.onrender.com';
```

**Note**: No API keys to configure - OpenStreetMap works out of the box!

## Step 4: Test Deployment

1. Visit your Render.com service URL
2. Test sharing location
3. Test viewing location from another device/browser
4. Check Render logs for any errors

## Environment Variables on Render

Go to your service → Environment tab to add/edit (if needed):

- `PORT`: Auto-set by Render (don't override)
- `NODE_ENV`: `production` (optional, good practice)

**No API keys needed** - OpenStreetMap is completely free!

## Troubleshooting

### Issue: Leaflet map not loading
- Check browser console for errors
- Verify Leaflet CSS and JS are loading correctly
- Check network tab for failed resource requests

### Issue: WebSocket connection failing
- Ensure you're using HTTPS (Render provides this automatically)
- Check CORS settings in `server.js`
- Verify Socket.io is correctly initialized

### Issue: Location permission not working
- Geolocation API requires HTTPS (Render provides this)
- Ensure you're accessing via HTTPS URL, not HTTP

### Issue: Sessions not persisting
- This is expected - using in-memory storage
- Sessions will reset on server restart
- Consider adding database if persistence needed

## Monitoring

- Check Render dashboard for logs
- Monitor service health
- Check usage/limits on free tier

## Free Tier Limits

Render.com free tier includes:
- 750 hours/month (enough for one service running 24/7)
- Automatic SSL certificates
- Sleep after 15 minutes of inactivity (service spins up on request)

