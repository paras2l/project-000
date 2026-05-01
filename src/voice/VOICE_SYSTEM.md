# NATSU Voice System

Complete TypeScript voice system with dual voices, personality management, and Supabase config sync.

## Architecture Overview

The NATSU voice system is built with a modular, event-driven architecture:

```
User Voice Input
    ↓
Wake-Word Detector (Porcupine)
    ↓ [Wake word detected]
Voice Config Manager [loads personality]
    ↓
STT Engine (Deepgram/Whisper)
    ↓ [speech recognized]
Command Parser [extracts intent + params]
    ↓
Voice Manager [executes command]
    ↓
TTS Engine (ElevenLabs/OpenAI) [with personality]
    ↓
Voice Output [with personality modulation]
```

## Key Features

### 1. **Dual Voice System**
- **Female voice**: Cute, sweet, bestie vibe (ElevenLabs Rachel / OpenAI Nova)
- **Male voice**: Deep, professional (OpenAI Onyx / Echo)
- Each voice has independent wake word configuration
- Switch between voices via voice command: `"Switch to male voice"`

### 2. **Personality System**
Five personality types that modify voice characteristics:
- **Cute**: Higher pitch (1.3x), faster rate (1.1x), playful tone
- **Warm**: Normal pitch (1.1x), slower rate (0.95x), gentle tone
- **Professional**: Lower pitch (0.95x), even slower (0.9x), formal tone
- **Energetic**: Higher pitch (1.2x), much faster (1.3x), enthusiastic tone
- **Calm**: Lower pitch (0.85x), slowest (0.75x), soothing tone

Apply personality via: `"Be more professional"` or `"Set personality to calm"`

### 3. **Command-Configurable System**
All settings changeable at runtime via voice commands:

```
"Change wake word to hey bestie"
"Switch to male voice"
"Be more energetic"
"Volume 80" or "Turn up volume"
"Increase pitch" / "Decrease pitch"
"Speed up" / "Slow down"
```

Parser automatically extracts intent and parameters from natural language.

### 4. **Supabase Integration**
- Config stored in Supabase for cross-device sync
- Settings persist across app restarts
- Structure:
  ```typescript
  {
    userId: string,
    currentVoice: 'female' | 'male',
    femaleWakeWord: string,
    maleWakeWord: string,
    personality: PersonalityType,
    volume: 0-1,
    pitch: 0.5-2.0,
    speed: 0.5-2.0,
    enableAutoPersonality: boolean,
    updatedAt: ISO8601
  }
  ```

### 5. **Always-On Listening**
- Porcupine-based on-device detection (low battery/CPU usage)
- Simultaneous monitoring of both female/male wake words
- No cloud processing until wake word detected
- Resumable after command processing

## File Structure

```
src/voice/
├── types.ts
│   └── All interfaces: VoiceConfig, ParsedVoiceCommand, WakeWordEvent, etc.
│
├── personalities.ts
│   ├── PERSONALITY_PRESETS: { cute, warm, professional, energetic, calm }
│   ├── VOICE_MODELS: voice ID mappings
│   └── applyPersonalityToSettings(): applies personality modifiers
│
├── voice-config.ts
│   ├── VoiceConfigManager class
│   ├── Loads/saves config from Supabase
│   ├── parseVoiceCommand(): NLP command parsing
│   └── executeVoiceCommand(): applies config changes
│
├── voice-manager.ts
│   ├── VoiceManager class (main API)
│   ├── initialize(): setup all engines
│   ├── startListening(): always-on mode
│   ├── speak(text): output with personality
│   ├── switchVoice(voice): change active voice
│   ├── setPersonality(type): change personality
│   └── handleCommand(text): process voice command
│
└── engines/
    ├── stt-engine.ts
    │   ├── DeepgramSTT class (cloud)
    │   └── WhisperSTT class (local)
    │
    ├── tts-engine.ts
    │   ├── ElevenLabsTTS class (high quality)
    │   └── OpenAITTS class (flexible)
    │
    └── wake-word.ts
        └── PorcupineWakeWordDetector class
```

## Usage Guide

### Initialization

```typescript
import { createVoiceManager } from './src/voice';

// Create manager
const voiceManager = createVoiceManager('user-id-123');

// Initialize all engines
await voiceManager.initialize();

// Start listening for wake words
await voiceManager.startListening();
```

### Speaking

```typescript
// Speak with current personality
await voiceManager.speak("Hello, I'm Natsu!");

// Get current config
const config = voiceManager.getConfig();
console.log(config.personality); // "cute"
```

### Voice Commands

```typescript
// Process voice command (auto-parses intent)
await voiceManager.handleCommand("Be more professional");

// Or use direct methods
await voiceManager.switchVoice('male');
await voiceManager.setPersonality('energetic');
```

### Event Handling

```typescript
voiceManager.on('wake-word-detected', (event) => {
  console.log(`Detected: ${event.voice} voice, "${event.wakeWord}"`);
});

voiceManager.on('speech-recognized', (event) => {
  console.log(`Recognized: "${event.text}"`);
});

voiceManager.on('personality-changed', (event) => {
  console.log(`Now speaking with: ${event.newPersonality}`);
});

voiceManager.on('error', (event) => {
  console.error(`Voice error: ${event.context}`, event.error);
});
```

## Configuration Setup

### Environment Variables

Create `.env` file in project root:

```env
# Speech-to-Text
DEEPGRAM_API_KEY=<your-deepgram-key>

# Text-to-Speech
ELEVENLABS_API_KEY=<your-elevenlabs-key>
OPENAI_API_KEY=<your-openai-key>

# Wake Word Detection
PORCUPINE_ACCESS_KEY=<your-porcupine-key>

# Config Storage
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-anon-key>
```

### First Run

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start (will load config from Supabase)
npm start
```

## Implementation Notes

### Personality Adjustments
Each personality preset defines:
- **Pitch multiplier**: 0.5-2.0 (affects voice frequency)
- **Rate multiplier**: 0.5-2.0 (affects speaking speed)
- **Tone**: used for voice model selection

When speaking, personality adjustments are applied on top of current voice settings:
```typescript
const adjusted = {
  pitch: basePitch * personalityPreset.pitch,
  rate: baseRate * personalityPreset.rate,
  volume: baseVolume // unchanged
}
```

### Command Parser
Uses regex patterns to extract intent and parameters:
- "change wake word to X" → `{ intent: 'change-wake-word', parameters: { newWakeWord: 'X' } }`
- "switch to male voice" → `{ intent: 'switch-voice', parameters: { voice: 'male' } }`
- "turn up volume" → `{ intent: 'adjust-volume', parameters: { delta: 0.1 } }`

Supports natural language variations (case-insensitive, flexible wording).

### Event Flow
1. Wake word detected → `'wake-word-detected'` event
2. Listening starts → `'listening-started'` event
3. Speech captured → `'speech-recognized'` event
4. Command parsed → internal execution
5. Config updated → `'config-updated'` event
6. TTS plays response → `'speech-start'`, `'speech-end'` events
7. Resume listening → back to step 1

## Future Enhancements

- [ ] Auto-detect personality based on user sentiment/time of day
- [ ] Add message queuing for multiple speak() calls
- [ ] ML-based emotion detection for sentiment analysis
- [ ] Voice transcription history / conversation logging
- [ ] Custom personality creation (user-defined pitch/rate presets)
- [ ] Multi-language support with language selection command
- [ ] Voice effects (reverb, echo, etc.)
- [ ] Per-contact voice preferences
- [ ] Schedule-based personality (work hours vs casual)

## Dependencies

- **STT**: `@deepgram/sdk` (optional, uses Whisper if not installed)
- **TTS**: `openai` (primary), `elevenlabs` (optional)
- **Wake Word**: `porcupine-web`
- **Config**: `@supabase/supabase-js`
- **Events**: Node.js built-in `events` module
- **Types**: `@types/node`

Install all with: `npm install`

## Troubleshooting

### Wake word not detected
- Verify `PORCUPINE_ACCESS_KEY` is set
- Check microphone is working and has permissions
- Test with `voiceManager.startListening()`

### TTS voice sounds wrong
- Verify API keys (OPENAI_API_KEY or ELEVENLABS_API_KEY)
- Check personality settings in config
- Try different TTS provider

### Commands not recognized
- Enable debug logging: `console.log(parseVoiceCommand(text))`
- Check confidence score > 0.5
- Try more natural wording variations

### Config not persisting
- Verify Supabase credentials
- Check internet connection
- Config falls back to defaults if Supabase unavailable

## License

Part of NATSU project - proprietary AI assistant
