# Quick Deployment Guide

## Step 1: Push to GitHub

If you haven't created a GitHub repository yet:

1. Go to https://github.com/new
2. Create a new repository (name it `thebrain` or whatever you prefer)
3. **Don't** initialize with README, .gitignore, or license (you already have these)

Then run:

```bash
cd /home/steve/code/thebrain

# Add GitHub remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git push -u origin main
```

## Step 2: Deploy to Render.com

1. **Sign up/Login**: Go to https://dashboard.render.com
   - Sign up with GitHub (easiest way)

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select your `thebrain` repository

3. **Configure Service**:
   - **Name**: `thebrain` (or your preferred name)
   - **Region**: Choose closest to you/your users
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node server.js`

4. **Environment Variables** (optional):
   - Click "Advanced"
   - Add: `NODE_ENV` = `production` (optional but recommended)
   - **No API keys needed!** OpenStreetMap is free

5. **Create Service**:
   - Click "Create Web Service"
   - Wait for deployment (usually 2-3 minutes)

6. **Get Your URL**:
   - Once deployed, you'll get a URL like: `https://thebrain.onrender.com`
   - This is your live site! 🎉

## Step 3: Test Your Deployment

1. Visit your Render URL (e.g., `https://thebrain.onrender.com`)
2. Test sharing location from one device
3. Test viewing from another device
4. Check that everything works!

## Important Notes

- **Free Tier**: Render free tier sleeps after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up.
- **HTTPS**: Render automatically provides HTTPS (required for geolocation)
- **Logs**: Check Render dashboard → Logs tab if you encounter issues
- **Updates**: Every push to `main` branch automatically redeploys

## Troubleshooting

- **Build fails**: Check logs in Render dashboard
- **App doesn't load**: Check that build/start commands are correct
- **Location not working**: Make sure you're using HTTPS (Render provides this)
- **Socket.io errors**: Check CORS settings (should work automatically)

## Next Steps (Optional)

- Add a custom domain
- Set up monitoring/alerts
- Add database for persistent sessions (if needed later)

