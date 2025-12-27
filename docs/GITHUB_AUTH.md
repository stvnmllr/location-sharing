# GitHub Authentication Setup

GitHub no longer accepts passwords for Git operations. You need a Personal Access Token (PAT).

## Option 1: Personal Access Token (Recommended)

### Step 1: Create a Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "thebrain-deployment" (or any name)
4. Select scopes:
   - ✅ **repo** (full control of private repositories)
   - ✅ **workflow** (if you plan to use GitHub Actions)
5. Click "Generate token"
6. **IMPORTANT**: Copy the token immediately (you won't see it again!)
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Use the Token

When you push, use the token as your password:

```bash
git push origin main
# Username: stvnmllr
# Password: <paste your token here>
```

### Step 3: Save Credentials (Optional but Recommended)

To avoid entering the token every time:

```bash
# Store credentials in Git credential helper
git config --global credential.helper store

# Then push (enter token once, it will be saved)
git push origin main
```

Or use a credential manager:
```bash
git config --global credential.helper cache  # Caches for 15 minutes
```

## Option 2: SSH Keys (Alternative)

If you prefer SSH:

### Step 1: Generate SSH Key
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Press Enter to accept default location
# Optionally set a passphrase
```

### Step 2: Add to SSH Agent
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### Step 3: Add to GitHub
```bash
# Copy your public key
cat ~/.ssh/id_ed25519.pub
```

1. Go to https://github.com/settings/keys
2. Click "New SSH key"
3. Paste your public key
4. Click "Add SSH key"

### Step 4: Change Remote to SSH
```bash
git remote set-url origin git@github.com:stvnmllr/location-sharing.git
```

## Option 3: GitHub CLI (gh)

If you have GitHub CLI installed:

```bash
gh auth login
# Follow the prompts
```

## Quick Fix for Current Push

If you just want to push now:

1. Get a token: https://github.com/settings/tokens (generate new, select "repo" scope)
2. When prompted for password, paste the token instead
3. Or update the remote URL to include the token (less secure):

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/stvnmllr/location-sharing.git
```

**Note**: This embeds the token in the URL, which is less secure but works for quick pushes.

