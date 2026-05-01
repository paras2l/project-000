# NATSU Setup - Visual Flowchart 🎯

## **The 3-Step Journey (Simplified)**

```
START HERE
    ↓
    │
    ├─ 🐍 STEP 1: Install Python
    │  └─ Download from python.org
    │     └─ Run installer
    │        └─ Check "Add to PATH"
    │           └─ Wait 2 minutes
    │              └─ ✓ Python Ready
    │
    ├─ 🎙️ STEP 2: Create Kokoro.onnx
    │  └─ Create Python script
    │     └─ Run: python convert_kokoro.py
    │        └─ Wait 5-10 minutes
    │           └─ Check Desktop for kokoro.onnx
    │              └─ File size: 30-40 MB
    │                 └─ ✓ Model Created
    │
    ├─ 📤 STEP 3: Upload to GitHub
    │  └─ Create GitHub repo
    │     └─ Upload kokoro.onnx
    │        └─ Create Release v1.0
    │           └─ Copy release URL
    │              └─ ✓ Models on GitHub
    │
    ├─ ⚙️ STEP 4: Update App Config
    │  └─ Edit natsu-config.ts
    │     └─ Paste GitHub URL
    │        └─ Save file
    │           └─ ✓ Config Updated
    │
    └─ ✅ DONE!
       │
       └─ Run: npm run dev:web
          └─ Opens: http://localhost:5173
             └─ Say: "Create a British female voice"
                └─ Hear: Custom voice respond
                   └─ 🎉 SUCCESS! 🚀
```

---

## **What Happens Behind The Scenes**

```
YOUR COMPUTER                          GITHUB SERVERS
─────────────────────────────────────────────────────

┌─ Python Script Runs ──┐
│  convert_kokoro.py    │
│  ┌─────────────────┐  │
│  │ Downloads Kokoro│  │ ──(internet)──> HuggingFace Servers
│  │    Model        │  │                 └─ Gets model file
│  └─────────────────┘  │ <───────────────
│         ↓             │
│  ┌─────────────────┐  │
│  │ Converts Format │  │  (From PyTorch to ONNX)
│  │ PyTorch → ONNX  │  │
│  └─────────────────┘  │
│         ↓             │
│  ┌─────────────────┐  │
│  │ Creates File:   │  │
│  │ kokoro.onnx     │  │
│  │ (30-40 MB)      │  │
│  └─────────────────┘  │
└─────────────────────┬─┘
                      │
                      ↓ (You drag & drop)
          ┌─────────────────────┐
          │  GitHub Repository  │
          │  (Cloud Storage)    │
          │  ┌───────────────┐  │
          │  │ kokoro.onnx   │  │
          │  │ (stored here) │  │
          │  └───────────────┘  │
          └──────────┬──────────┘
                     │
                     │ (App downloads)
                     ↓
          Your Computer Again:
          ┌─────────────────┐
          │  Cached Models  │
          │  (Browser/Phone)│
          └─────────────────┘
                     │
                     ↓ (Voice generation works!)
          ┌─────────────────┐
          │ Kokoro Engine   │
          │ Generates Voice │
          └─────────────────┘
                     │
                     ↓
          "You have beautiful smile" (in FLIRTY voice)
```

---

## **File Journey**

```
1. CREATION PHASE
   ┌──────────────────┐
   │ Your PC          │
   │ Desktop          │
   │ └─ kokoro.onnx   │ ← You create this
   │   (30-40 MB)     │
   └────────┬─────────┘
            │
            │ (Upload)
            ↓
2. GITHUB PHASE
   ┌──────────────────┐
   │ GitHub Cloud     │
   │ natsu-models     │
   │ Release v1.0     │
   │ └─ kokoro.onnx   │ ← Stored here
   │   (30-40 MB)     │
   └────────┬─────────┘
            │
            │ (App downloads)
            ↓
3. USAGE PHASE
   ┌──────────────────┐
   │ Your Browser     │
   │ Cache/Storage    │
   │ └─ kokoro.onnx   │ ← Cached locally
   │   (30-40 MB)     │
   └──────────────────┘
            │
            │ (Use for voice generation)
            ↓
   ┌──────────────────┐
   │ Generates        │
   │ Custom Voices    │
   │ Infinite Tones   │
   └──────────────────┘
```

---

## **Step 1: Python Installation**

```
YOUR BROWSER                          YOUR COMPUTER
────────────────────────────────────────────────
                                      
python.org ─────────────────────→ Downloads Folder
  │                                      │
  │ Click "Download Python 3.11"        │
  │                                      │
  └─ File: python-3.11-amd64.exe ←─────┘
                                      
                                      Desktop
                                        │
                                  ┌─ Double-click
                                  │
                                  ↓
                        ┌─────────────────────┐
                        │ Python Installer    │
                        ├─────────────────────┤
                        │ ☑ Add to PATH       │ ← IMPORTANT!
                        │ [Install Now]       │ ← CLICK HERE
                        └─────────────────────┘
                                  │
                                  ↓ (2-3 minutes)
                        
                        ✓ Python installed!
                        
                        Test:
                        Command Prompt → python --version
                                      → Python 3.11.x ✓
```

---

## **Step 2: Kokoro Conversion**

```
DESKTOP
────────────────────────────────────

Notepad
  │
  ├─ Create new file
  │  └─ Paste Python code
  │
  ├─ Save as: convert_kokoro.py
  │  └─ Location: Desktop
  │
  └─ ✓ File ready

         ↓

Command Prompt (Right-click Desktop → Open Terminal)
  │
  ├─ Type: python convert_kokoro.py
  │  └─ Press Enter
  │
  ├─ Script runs:
  │  ├─ [1/5] Installing packages...
  │  ├─ [2/5] Downloading model... (2 min)
  │  ├─ [3/5] Loading model...
  │  ├─ [4/5] Converting... (3-5 min)
  │  └─ [5/5] Done!
  │
  └─ ✓ Success!

         ↓

DESKTOP
  │
  ├─ New file appears: kokoro.onnx
  │  └─ Size: 30-40 MB
  │
  └─ ✓ Ready to upload
```

---

## **Step 3: GitHub Upload**

```
1. CREATE REPO
   Browser → github.com
   │
   ├─ Click "+" (top right)
   ├─ "New repository"
   ├─ Name: natsu-models
   ├─ Public ✓
   └─ "Create repository" → ✓

2. UPLOAD FILE
   GitHub repo page
   │
   ├─ Click "Add file" → "Upload files"
   ├─ Drag kokoro.onnx from Desktop
   ├─ Wait for upload (progress bar)
   ├─ "Commit changes" → ✓
   └─ File now on GitHub ✓

3. CREATE RELEASE
   GitHub repo page
   │
   ├─ Right side → Click "Releases"
   ├─ "Create a new release"
   ├─ Tag: v1.0
   ├─ Title: NATSU Model Pack v1.0
   ├─ Upload kokoro.onnx again
   ├─ "Publish release"
   └─ ✓ Release created!

4. GET URL
   Release page
   │
   └─ Copy this:
      https://github.com/YOUR-USERNAME/natsu-models/releases/download/v1.0/kokoro.onnx
      └─ Keep this URL! ← Next step
```

---

## **Step 4: Update App Config**

```
VS CODE
────────────────────────────────────

Open File
  │
  ├─ src/
  ├─ shared/
  ├─ natsu-config.ts ← Click here
  │
  └─ File opens

Edit
  │
  ├─ Find: modelSources: {
  ├─ Find: voiceModels: '...' ← Replace this
  │
  ├─ Change from:
  │  'https://github.com/paras2l/natsu-models/.../kokoro.onnx'
  │
  ├─ Change to:
  │  'https://github.com/YOUR-USERNAME/natsu-models/.../kokoro.onnx'
  │
  └─ Replace username only!

Save
  │
  ├─ Ctrl+S ← Press this
  │
  └─ ✓ File saved!
```

---

## **Step 5: Run App**

```
VS CODE TERMINAL (Ctrl+`)
────────────────────────────────────

Type:
  cd "d:\project 000\natsu"
  ↓ Press Enter

Type:
  npm install
  ↓ Press Enter
  ↓ Wait 2 minutes

Type:
  npm run dev:web
  ↓ Press Enter
  ↓ Wait 30 seconds

You'll see:
  "VITE v5.0.0  ready in 234 ms"
  "Local: http://localhost:5173"

         ↓

BROWSER
────────────────────────────────────

Go to:
  http://localhost:5173
  ↓ Open in browser

App loads
  │
  ├─ Click: 🎤 Start Listening
  ├─ Say: "Create a British female voice"
  ├─ Wait 2 seconds...
  │
  └─ Hear: Custom voice speak! ✅

SUCCESS! 🎉
```

---

## **Troubleshooting Tree**

```
Something went wrong?
        │
        ├─ "Python not found"?
        │  └─ Reinstall Python, check "Add to PATH"
        │
        ├─ Script errors?
        │  └─ Delete kokoro.onnx, run again
        │
        ├─ GitHub upload fails?
        │  └─ Make sure repo is PUBLIC
        │
        ├─ App doesn't start?
        │  └─ Check config URL (spelling!)
        │
        └─ Models don't download?
           └─ Check browser console (F12)
              Look for error message
              Share error with support
```

---

## **Quick Status Check**

```
□ Step 1: Python installed?
  Test: Command Prompt → python --version

□ Step 2: kokoro.onnx created?
  Look: Desktop for 30-40 MB file

□ Step 3: GitHub repo created?
  Check: github.com/YOUR-USERNAME/natsu-models

□ Step 4: Files uploaded?
  Check: Release tab shows kokoro.onnx

□ Step 5: Config updated?
  Check: src/shared/natsu-config.ts has correct URL

□ Step 6: App running?
  Check: http://localhost:5173 opens

□ Step 7: Voice works?
  Test: Say "Create a voice" → Hear response

All checked? ✅ YOU'RE DONE! 🚀
```

---

**Ready to start? Begin with Step 1: Install Python!** 🐍
