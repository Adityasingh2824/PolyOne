# 🚀 How to Run PolyOne Project

## ⚡ Quick Start (PowerShell Commands)

### Option 1: Simple One-Line Command
```powershell
cd frontend; npm run dev
```

### Option 2: Step by Step
```powershell
# Step 1: Go to frontend folder
cd frontend

# Step 2: Start the development server
npm run dev
```

### Option 3: Using the Root Script
```powershell
# From the root directory
npm run dev
```

---

## 📋 First Time Setup

If you haven't installed dependencies yet:

```powershell
# Install frontend dependencies
cd frontend
npm install

# Go back to root
cd ..

# Install backend dependencies (optional for now)
cd backend
npm install

# Go back to root
cd ..
```

---

## 🌐 Access Your App

Once running, open your browser to:

### 👉 http://localhost:3000

You should see the beautiful Juno Network-style landing page!

---

## 🎯 What You'll See:

1. **Landing Page** - Cosmic design with animated gradient orbs
2. **Connect Wallet** button - Click to connect MetaMask
3. **Navigation** - All links work (no more 404!)
4. **Beautiful UI** - Purple/pink/cyan gradients everywhere

---

## 🔧 Troubleshooting

### ❌ Port 3000 Already in Use?

**Find what's using the port:**
```powershell
netstat -ano | findstr :3000
```

**Kill the process:**
```powershell
# Replace <PID> with the actual Process ID from above
taskkill /PID <PID> /F
```

### ❌ Module Not Found Error?

**Install dependencies:**
```powershell
cd frontend
npm install
```

### ❌ ENOENT Error?

**Make sure you're in the frontend folder:**
```powershell
cd "C:\Users\Aditya singh\PolyOne\frontend"
npm run dev
```

---

## 📱 Test Your App

Once it's running, try these:

- [ ] Open http://localhost:3000
- [ ] Click "Connect Wallet" → MetaMask opens
- [ ] Click "Launch App" → Goes to dashboard
- [ ] Click "Start using PolyOne" → Goes to signup
- [ ] Click "Start building" → Goes to docs
- [ ] All navigation works - no 404 errors!

---

## 🎨 What's Running:

```
✅ Next.js Development Server
✅ Port: 3000
✅ Hot reload enabled
✅ Fast refresh active
✅ All routes working
```

---

## 🚀 Full Stack (Optional)

If you want to run backend too:

### Terminal 1 (Frontend):
```powershell
cd frontend
npm run dev
```

### Terminal 2 (Backend):
```powershell
cd backend
npm run dev
```

**Note:** For now, just frontend is enough to see the beautiful UI and wallet connectivity!

---

## 💡 Pro Tips

### PowerShell vs Bash:
- ❌ Don't use `&&` in PowerShell
- ✅ Use `;` instead
- ✅ Or run commands separately

### Examples:
```powershell
# ❌ WRONG (Bash syntax)
cd frontend && npm run dev

# ✅ RIGHT (PowerShell syntax)
cd frontend; npm run dev

# ✅ ALSO RIGHT (Separate commands)
cd frontend
npm run dev
```

---

## 🎉 You're Done!

Just run:
```powershell
cd frontend
npm run dev
```

Then visit: **http://localhost:3000**

**Enjoy your beautiful Juno-style blockchain platform!** ✨🚀

