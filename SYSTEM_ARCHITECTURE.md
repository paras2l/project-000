# NATSU Advanced Voice AI System Architecture

## Overview

**NATSU** is a **24/7, fully customizable voice AI** with:
- ✓ Continuous background wake word listening (always on, like Siri)
- ✓ Unlimited voice generation by natural language command
- ✓ Flexible, non-hardcoded configuration
- ✓ Cross-platform (Web + Mobile + Desktop)

## System Components

### 1. **Flexible Configuration** (`natsu-config.ts`)

Everything is configurable, nothing hardcoded:

```typescript
// User can change ANY setting at runtime
config.wakeWord.phrases = ['natsu', 'hey natsu', 'ok assistant'];
config.voice.engine = 'kokoro';
config.modelSources.wakeWordModels = 'https://github.com/custom/models.git';
```

**Features:**
- Load/save from localStorage
- Import/export as JSON
- Validate all settings
- Environment variable overrides

### 2. **24/7 Wake Word Detection** (`wake-word-detector.ts`)

Based on:
- **hey-siri**: CNN-RNN architecture (95% accuracy)
- **ha-openwakeword**: Flexible model distribution
- **N.E.K.O**: Background streaming + interruption

**How it works:**
```
Continuous audio stream → Spectrogram generation (FFT) →
Model inference (TensorFlow Lite) → Confidence check →
If above threshold → Emit 'wake-word-detected' event
```

**Features:**
- Add/remove wake phrases dynamically (no restart)
- Adjust sensitivity and confidence threshold
- Pause briefly after detection (let command processor run)
- Multiple phrases simultaneously

**Example:**
```typescript
const detector = new WakeWordDetector(config);
await detector.start(); // 24/7 listening starts
detector.addWakePhrase('hey natsu'); // Add new phrase
detector.on('wake-word-detected', (event) => {
  console.log(`Detected: ${event.phrase}`);
  // Process voice command
});
```

### 3. **Kokoro TTS - Unlimited Voices** (`kokoro-tts.ts`)

Generate **unlimited voices** by parameter:

```typescript
// Same engine, infinite voices
await kokoro.speak({
  text: 'Hello world',
  voiceParams: {
    gender: 'female',
    age: 25,
    emotion: 'happy',
    accent: 'british',
    speed: 1.0,
    pitch: 1.2,
    volume: 0.8,
    roughness: 0.0,
    brightness: 0.8,
  },
});
```

**Features:**
- Generate voice from parameters (not presets)
- Save favorite voice for reuse
- Export/import voice configurations
- Interrupt current speech instantly (N.E.K.O style)
- Streaming synthesis with callbacks

### 4. **Voice Command Parser** (`voice-command-parser.ts`)

Convert natural language → voice parameters:

```
User says: "Create a 25 year old British female with mysterious tone and raspy voice"
                        ↓
Parser extracts: gender=female, age=25, accent=british, emotion=mysterious, roughness=0.8
                        ↓
Kokoro generates this exact voice
```

**Supported commands:**
```
"Create a deep male voice"
"Make voice older and more raspy"
"Switch to happy emotion with faster speed"
"Make voice brighter and louder"
"Generate 70 year old wise British voice"
```

**Intelligence:**
- Age inference: "young" → 22, "middle-aged" → 45, "old" → 70
- Emotion mapping: "mysterious" → emotional parameter
- Quality extraction: "raspy" → roughness parameter
- Range validation: Ensures all params stay in valid ranges

### 5. **Voice Configuration System**

**No hardcoding - completely flexible:**

```typescript
// Change settings without code changes
config.wakeWord.phrases = ['ok assistant', 'hey voice'];
config.voice.defaultGender = 'male';
config.voice.defaultEmotion = 'professional';
config.modelSources.voiceModels = 'https://github.com/custom/voices.git';

// Save to localStorage (web/mobile)
saveConfigToStorage(config);

// Load on next startup
const config = loadConfigFromStorage();
```

**User can:**
- Add/remove wake words dynamically
- Adjust sensitivity on the fly
- Switch TTS engines
- Point to different model repositories
- Import/export settings as JSON

## Data Flow

### **Wake Word Detection → Voice Command → Voice Generation**

```
┌─────────────────────────────────────────────────────┐
│ Continuous Audio Stream (24/7)                      │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
        ┌────────────────┐
        │ Spectrogram    │ (FFT, 101 freq bins)
        │ Generation     │ (hey-siri approach)
        └────────┬───────┘
                 │
                 ↓
        ┌────────────────────┐
        │ Model Inference    │ (TFLite model)
        │ (wake word models) │ (loaded from config.modelSources)
        └────────┬───────────┘
                 │
        ┌────────┴────────┐
        │                 │
    Confidence        Confidence
    < threshold       >= threshold
        │                 │
        ↓                 ↓
     Continue        WAKE WORD DETECTED!
     Listening       │
                     ↓
            ┌────────────────────┐
            │ Pause Listening    │ (3 seconds)
            │ (let user speak)   │
            └────────┬───────────┘
                     │
                     ↓
            ┌────────────────────┐
            │ Speech Recognition │ (Web Speech API)
            │ Get user command   │
            └────────┬───────────┘
                     │
                     ↓
            ┌────────────────────────┐
            │ Voice Command Parser   │ (NLP inference)
            │ "Create X voice"       │
            └────────┬───────────────┘
                     │
                     ↓
            ┌────────────────────────┐
            │ Extract Parameters     │
            │ gender, age, emotion   │
            └────────┬───────────────┘
                     │
                     ↓
            ┌────────────────────────┐
            │ Kokoro TTS             │
            │ Generate voice         │
            │ Synthesize speech      │
            └────────┬───────────────┘
                     │
                     ↓
            ┌────────────────────────┐
            │ Play Audio             │ (WebAudio API)
            │ With params applied    │
            └────────┬───────────────┘
                     │
                     ↓
        Resume 24/7 Listening
        (go back to top)
```

## Key Features

### **1. Flexibility (No Hardcoding)**
- Change wake words without recompiling
- Switch between TTS engines on the fly
- Load models from any GitHub repo
- Adjust sensitivity/thresholds in real-time
- Import/export user settings as JSON

### **2. 24/7 Listening**
- Continuous background audio processing
- Pause briefly after detection (let command processor run)
- Resume automatically after 3 seconds
- Multiple wake phrase support
- Adjustable sensitivity

### **3. Unlimited Voices**
- Generate ANY voice by describing it
- Save favorite voices
- Modify voices in real-time
- Export/import voice configurations
- No limit on number of voices

### **4. Natural Language Understanding**
- Parse complex voice commands
- Infer parameters from descriptions
- Smart defaults (age inference, emotion mapping)
- Handle "more X, less Y" modifications

### **5. Interruption Handling** (N.E.K.O style)
- Stop current speech instantly
- Discard pending audio buffers
- Seamless transition to new commands
- No audio artifacts

## Configuration Examples

### **Example 1: Customer Service Bot**
```typescript
config.wakeWord.phrases = ['hello agent', 'hi assistant'];
config.voice.defaultEmotion = 'professional';
config.voice.defaultSpeed = 0.9; // Slightly slower
config.voice.defaultGender = 'neutral';
```

### **Example 2: Gaming Voice**
```typescript
config.wakeWord.phrases = ['hey player', 'alright let\'s go'];
config.voice.defaultEmotion = 'excited';
config.voice.defaultSpeed = 1.2; // Faster
config.voice.defaultPitch = 1.1; // Slightly higher
```

### **Example 3: Accessibility**
```typescript
config.wakeWord.sensitivity = 0.8; // Very sensitive
config.voice.volume = 1.0; // Maximum volume
config.audio.sampleRate = 16000; // High quality
```

## Deployment Architecture

### **Web**
```
GitHub Models ←──── Auto-downloader
       ↓
   Browser Cache
       ↓
   Kokoro WASM
       ↓
   Web Speech API
```

### **Mobile (iOS/Android)**
```
GitHub Models ←──── Auto-downloader
       ↓
   Device Storage
       ↓
   TensorFlow Lite
       ↓
   Native TTS API
```

### **Desktop (Electron)**
```
GitHub Models ←──── Auto-downloader
       ↓
   Local File System
       ↓
   Python Kokoro (subprocess)
       ↓
   System Audio
```

## Future Enhancements

1. **ML Model Training**
   - User-specific wake word training
   - Personalized voice cloning

2. **Advanced Features**
   - Emotion detection from user voice
   - Accent adaptation
   - Background noise handling

3. **Enterprise**
   - Multi-user support
   - Cloud sync
   - Advanced analytics

4. **Accessibility**
   - Screen reader integration
   - Gesture commands
   - Eye tracking support

## Performance Targets

| Metric | Target |
|--------|--------|
| Wake word detection latency | <100ms |
| Voice generation time | <500ms |
| Memory usage | <50MB |
| CPU usage (idle) | <5% |
| Accuracy | >95% |

---

**NATSU: The voice AI that adapts to YOU, not the other way around.** 🎤✨
