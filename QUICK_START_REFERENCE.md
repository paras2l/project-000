# NATSU Quick Reference - 3 Steps to Victory 🚀

## **COPY-PASTE QUICK START**

**If you just want commands, paste these in Command Prompt:**

### **Step 1: Install Python (First Time Only)**

```
Download: https://www.python.org/downloads/
Click: Download Python 3.11
Install: Check "Add Python to PATH" ✓
```

### **Step 2: Create Kokoro ONNX File**

**Create file:** `convert_kokoro.py` on Desktop

**Paste this code:**
```python
import torch
import os

print("Installing packages...")
os.system('pip install torch torchaudio numpy onnx onnxruntime')

print("Downloading Kokoro...")
os.system('pip install git+https://github.com/huggingface/kokoro')

print("Converting to ONNX...")
from kokoro import KokoroTTS
model = KokoroTTS.from_pretrained('kokoro_v0_19.pth')
dummy_input = torch.randn(1, 1, 22050)
torch.onnx.export(model, dummy_input, 'kokoro.onnx', 
                  input_names=['audio'], output_names=['synthesis'])

print("✓ Done! Check for kokoro.onnx (30-40 MB)")
```

**Run it:**
```bash
python convert_kokoro.py
```

**Wait 5-10 minutes...** Then you'll have `kokoro.onnx` file ✅

### **Step 3: Upload to GitHub**

1. Go to: `https://github.com/new` (new repository)
2. Name it: `natsu-models`
3. Click "Create repository"
4. Click "Add file → Upload files"
5. Select your `kokoro.onnx` file
6. Scroll down, click "Commit changes"
7. Click "Releases" on right
8. Click "Create a new release"
9. Tag: `v1.0`
10. Title: `NATSU Model Pack v1.0`
11. Upload the `kokoro.onnx` file
12. Click "Publish release"

**Copy your release URL:**
```
https://github.com/YOUR-USERNAME/natsu-models/releases/download/v1.0/kokoro.onnx
```

### **Step 4: Update App Config**

**Edit file:** `src/shared/natsu-config.ts`

**Find:**
```typescript
modelSources: {
  wakeWordModels: '...',
  voiceModels: '...',
```

**Replace with your GitHub URL:**
```typescript
modelSources: {
  wakeWordModels: 'https://github.com/YOUR-USERNAME/natsu-models/releases/download/v1.0/wake-word.tflite',
  voiceModels: 'https://github.com/YOUR-USERNAME/natsu-models/releases/download/v1.0/kokoro.onnx',
```

**Save file:** Ctrl+S

### **Step 5: Run App**

**In VS Code terminal:**
```bash
cd "d:\project 000\natsu"
npm install
npm run dev:web
```

**Open:** `http://localhost:5173`

**Say:** "Create a 25 year old British female voice"

**Hear:** Custom voice respond! ✅

---

## **VISUAL BUTTONS TO CLICK**

### **Python Install:**
```
📥 Download Button (yellow)
  ↓
⚙️ Run .exe file
  ↓
☑️ Check "Add Python to PATH"
  ↓
📦 Click "Install Now"
```

### **GitHub Steps:**
```
1️⃣  Sign in → github.com/login
2️⃣  Click "+" → "New repository"
3️⃣  Name: natsu-models
4️⃣  Click "Create repository"
5️⃣  Click "Add file" → "Upload files"
6️⃣  Drag kokoro.onnx
7️⃣  Click "Commit changes"
8️⃣  Click "Releases" on right side
9️⃣  Click "Create a new release"
🔟 Upload kokoro.onnx again
1️⃣1️⃣ Click "Publish release"
```

---

## **WHERE TO FIND THINGS**

| What | Where |
|------|-------|
| Python download | python.org/downloads |
| Create GitHub repo | github.com/new |
| Upload files | Click "Add file" → "Upload files" |
| Create release | Click "Releases" tab on right |
| Your model URL | Releases → v1.0 → Copy URL |
| App config file | src/shared/natsu-config.ts |
| Run app command | `npm run dev:web` in terminal |
| App URL | http://localhost:5173 |

---

## **WHAT EACH FILE DOES**

```
kokoro.onnx (30-40 MB)
├─ Voice generation engine
├─ Unlimited voice variations
└─ Works on all devices

natsu-config.ts (you edit this)
├─ Points to GitHub repo
├─ App downloads models automatically
└─ No hardcoding needed

GitHub Release
├─ Stores kokoro.onnx
├─ App downloads from here
└─ Can update anytime
```

---

## **EXPECTED FILE SIZES**

| File | Size | What It Means |
|------|------|--------------|
| kokoro.onnx | 30-40 MB | ✓ Correct |
| kokoro.onnx | <10 MB | ✗ Too small (corrupted) |
| kokoro.onnx | >100 MB | ✗ Too big (error) |

---

## **COMMON MISTAKES & FIXES**

| Mistake | Fix |
|---------|-----|
| "Python not found" | Reinstall Python, check "Add to PATH" |
| Script errors | Wait 2 minutes, try again |
| GitHub upload fails | Make repo PUBLIC, not private |
| App doesn't download models | Check username/repo name in config |
| Models don't work | Make sure release is named "v1.0" |

---

## **KEYBOARD SHORTCUTS**

| What | Key |
|------|-----|
| Save file | Ctrl+S |
| Search in file | Ctrl+F |
| Copy | Ctrl+C |
| Paste | Ctrl+V |
| Open terminal | Ctrl+` |
| Commit in git | Ctrl+Shift+G |

---

## **TIME ESTIMATES**

```
Python install        5 min
Kokoro conversion    10 min (download) + 5 min (convert)
GitHub setup         10 min
Config update         2 min
Test app              5 min
─────────────────────────────
TOTAL               37 min ✅
```

---

## **STEP-BY-STEP VIDEO SUMMARY**

If you get stuck, watch these (search YouTube):

1. "How to install Python on Windows" (2 min)
2. "How to create GitHub repository" (3 min)
3. "How to upload files to GitHub" (2 min)
4. "VS Code terminal basics" (3 min)

---

## **SUCCESS CHECKLIST**

- [ ] Python installed (check: `python --version`)
- [ ] kokoro.onnx file created (30-40 MB)
- [ ] GitHub repo created
- [ ] Models uploaded to GitHub
- [ ] Release created (v1.0)
- [ ] Config URLs updated
- [ ] `npm run dev:web` runs without errors
- [ ] App opens at localhost:5173
- [ ] Voice generation works
- [ ] Can hear custom voice speak

**When ALL checked: YOU'RE DONE!** 🎉

---

## **NEXT STEPS**

After voice system works:

1. **Mobile testing** (iOS/Android)
   ```bash
   npm run cap:add:ios
   npm run cap:open:ios
   ```

2. **Desktop testing** (Windows/Mac)
   ```bash
   npm run dev:electron
   ```

3. **Connect to LLM** (ChatGPT/Claude)
   - Detect response tone (flirty, professional, etc.)
   - Change voice automatically
   - See tone-detector.ts for implementation

4. **Deploy to web**
   ```bash
   npm run build:web
   ```

---

## **GET HELP**

If stuck, paste the **error message** from:
- Command Prompt (black window)
- Browser console (F12 → Console tab)
- VS Code output panel

**Error messages help us help you!** 💡

---

**You've got this! Start with Step 1: Install Python** 🐍
