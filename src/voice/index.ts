/**
 * NATSU Voice System Entry Point
 * Exports the main VoiceManager and related utilities
 */

// ============ FREE System (NEW) ============
export { VoiceManager, createVoiceManager } from './voice-manager-free';
export { VoiceConfigManager, createVoiceConfigManager } from './voice-config-free';
export { PersonalityEngine, createPersonalityEngine } from './personality-engine';
export * from './types-new';

// ============ Engines (FREE) ============
export { VoskSTT, createVoskSTT } from './engines/vosk-stt';
export { PiperTTS, createPiperTTS } from './engines/piper-tts';
export { OpenWakeWordDetector, createOpenWakeWordDetector } from './engines/openwakeword';

// ============ Legacy System (OLD - for migration) ============
// export { VoiceManager as VoiceManagerLegacy } from './voice-manager';
// export { VoiceConfigManager as VoiceConfigManagerLegacy } from './voice-config';
// export { getPersonalitySettings, applyPersonalityToSettings, PERSONALITY_PRESETS, VOICE_MODELS } from './personalities';
// export * from './types';
