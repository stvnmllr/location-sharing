# Setting up ngrok for HTTPS Testing

ngrok creates a secure HTTPS tunnel to your local server, which is required for geolocation on mobile browsers.

## Installation

### Option 1: Download from ngrok.com (Recommended)
1. Go to https://ngrok.com/download
2. Download the Linux version
3. Extract the binary:
   ```bash
   unzip ngrok.zip
   sudo mv ngrok /usr/local/bin/
   chmod +x /usr/local/bin/ngrok
   ```

### Option 2: Using snap (if available)
```bash
sudo snap install ngrok
```

### Option 3: Using package manager
```bash
# For Ubuntu/Debian
sudo apt install ngrok

# Or using npm (if you prefer)
npm install -g ngrok
```

## Sign up for free account (required)

1. Go to https://dashboard.ngrok.com/signup
2. Create a free account
3. Get your authtoken from the dashboard
4. Authenticate:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

## Usage

### Step 1: Start your server
Make sure your server is running:
```bash
cd server
npm run dev
```

### Step 2: Start ngrok tunnel
In a **new terminal**, run:
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

### Step 3: Use the HTTPS URL
- Copy the `https://` URL from ngrok output
- Use this URL on your phone instead of `http://192.168.1.81:3000`
- Example: `https://abc123.ngrok-free.app`

### Step 4: Test on your phone
1. Open the ngrok HTTPS URL on your phone
2. Click "Start Sharing"
3. Allow location permission when prompted
4. It should work now! 🎉

## Tips

- **Free tier**: ngrok free tier gives you a random URL each time. For a fixed URL, you need a paid plan.
- **Keep ngrok running**: Keep the ngrok terminal open while testing
- **Multiple tunnels**: You can run multiple ngrok instances for different ports
- **Inspect traffic**: Visit http://localhost:4040 to see requests going through ngrok

## Alternative: Use ngrok with a fixed subdomain (paid)

If you have a paid ngrok account:
```bash
ngrok http 3000 --subdomain=thebrain
```
This gives you: `https://thebrain.ngrok-free.app` (consistent URL)

## Troubleshooting

- **"ngrok: command not found"**: Make sure ngrok is in your PATH or use full path
- **"authtoken required"**: Run `ngrok config add-authtoken YOUR_TOKEN`
- **Connection refused**: Make sure your server is running on port 3000
- **Still getting permission errors**: Clear browser cache and try again

