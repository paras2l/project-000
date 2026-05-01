# NATSU Voice AI - Cross-Platform Setup

**One codebase, three platforms:** Web 🌐 + Mobile 📱 (iOS/Android via Capacitor) + Desktop 🖥️ (Electron)

## Quick Start

```bash
cd "d:\project 000\natsu"
npm install

# Choose one:
npm run dev:web       # Browser (fastest)
npm run dev:electron  # Desktop app
npm run cap:add:ios   # iOS app (Mac only)
npm run cap:add:android # Android app (Android Studio required)
```

## How It Works

**Personality = Voice Parameters (NO presets)**

You control everything by voice command:
- "increase pitch 30%" → makes voice higher
- "slow down" → makes voice slower  
- "louder" → increases volume
- "make voice sweeter" → smoothens voice
- "use male voice" → switches to male voice
- "save this as joyful" → saves current settings
- "switch to joyful" → loads saved settings

**No cloud, no APIs** — everything works offline, 100% locally.

## Installation

```bash
# Install Node modules (includes React, Vite, Capacitor, Electron)
npm install

# Install Capacitor CLI globally (for mobile)
npm install -g @capacitor/cli
```

## Running Locally

### 🌐 Web (Browser - Fastest for Development)

```bash
npm run dev:web
```

Opens `http://localhost:5173` automatically.

**Works on:**
- ✓ Chrome (best)
- ✓ Safari (iOS/Mac)
- ✓ Edge
- ✗ Firefox (no speech recognition)

### 🖥️ Desktop (Electron - Windows/Mac/Linux)

**Terminal 1:**
```bash
npm run dev:web
```

**Terminal 2:**
```bash
npm run dev:electron
```

Or build standalone:
```bash
npm run build:desktop
# Creates installer in dist/desktop/
```

### 📱 Mobile (iOS/Android)

#### Setup (first time only):

```bash
# iOS (Mac only)
npm run cap:add:ios

# Android (requires Android Studio)
npm run cap:add:android
```

#### Build and run:

```bash
npm run build:mobile

# iOS: Open in Xcode
npm run cap:open:ios

# Android: Open in Android Studio
npm run cap:open:android
```

## Voice Command Examples

After tapping "🎤 Start Listening":

| Category | Examples |
|----------|----------|
| **Pitch** | "increase pitch 30%", "make voice higher", "pitch 150%" |
| **Speed** | "slow down", "speak faster", "speed 75%" |
| **Volume** | "louder", "quieter", "volume 80%" |
| **Sweetness** | "make voice sweeter", "more robotic" |
| **Voice** | "use male voice", "switch to female" |
| **Tone** | "use bright tone", "make voice deep" |
| **Save** | "save this as joyful", "switch to joyful", "show saved" |

## Project Structure

```
src/
├── shared/voice-personality.ts   # Core voice system (all platforms)
├── ui/NatsuVoiceApp.tsx          # React UI (all platforms)
├── main.tsx                      # React entry
└── index.css                     # Styles

public/
├── electron.ts                   # Desktop main process
└── preload.ts                    # Desktop IPC bridge

index.html                        # HTML entry
vite.config.ts                    # Web/Electron build
capacitor.config.ts              # Mobile config
electron-builder.json            # Desktop packaging
```

## Building for Production

```bash
# Web (upload dist/web/ to any host)
npm run build:web

# Desktop (creates installers)
npm run build:desktop

# Mobile (sync to Xcode/Android Studio)
npm run build:mobile
```

## Personality Parameters

| Parameter | Range | Effect |
|-----------|-------|--------|
| Pitch | 0.5-2.0 | Voice pitch (low-high) |
| Speed | 0.5-2.0 | Speech rate (slow-fast) |
| Volume | 0-1 | Loudness |
| Sweetness | 0-1 | Smoothness (robotic-smooth) |
| Tone | bright/neutral/deep | Voice color |
| Voice Type | male/female | Voice gender |

All changes are **saved locally** (localStorage on web, SQLite on mobile) — NO cloud.

## Development

**Add new voice command:**
Edit `src/shared/voice-personality.ts` → `parseVoiceCommand()` function

**Add new UI feature:**
Edit `src/ui/NatsuVoiceApp.tsx` → React component

**Modify styles:**
Edit `src/index.css` or inline `styles` in React component

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Web Speech not working | Use Chrome/Safari/Edge (not Firefox) |
| Electron window is black | Kill process: `pkill -f electron` |
| No voice output | Check OS volume, drag "Volume" to 100% |
| Mobile build fails | Run `npm run cap:sync` before reopening |
| Can't find commands | Check console for parse confidence score |

## Scripts Summary

```bash
# Development
npm run dev:web              # Web dev server
npm run dev:electron         # Electron app

# Building
npm run build:web            # Build web
npm run build:mobile         # Build web + sync mobile
npm run build:desktop        # Build web + Electron
npm run build:all            # Build everything

# Mobile setup
npm run cap:add:ios          # Add iOS project
npm run cap:add:android      # Add Android project
npm run cap:open:ios         # Open Xcode
npm run cap:open:android     # Open Android Studio
npm run cap:sync             # Sync web to mobile
```

## What's Inside

- **React 18** - UI framework
- **Vite** - Ultra-fast build tool
- **TypeScript** - Type safety
- **Capacitor** - Web → iOS/Android bridge
- **Electron** - Web → Desktop
- **Web Speech API** - Voice input/output (native, no external APIs)
- **localStorage** - Local data persistence

## Next Steps

1. Install: `npm install`
2. Run web: `npm run dev:web`
3. Test voice commands (Chrome best)
4. Try desktop: `npm run dev:electron`
5. Deploy: `npm run build:web` then upload `dist/web/` to hosting
6. Mobile (optional): `npm run cap:add:ios` or `npm run cap:add:android`

**Zero paid services. Zero APIs. 100% offline. Works everywhere.** 🚀
