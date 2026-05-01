/// <reference types="node" />

/**
 * TypeScript types for NATSU's completely FREE voice system
 * - Vosk STT (local, free)
 * - Piper TTS (local, free)
 * - OpenWakeWord (local, free)
 * - Dynamic personalities (unlimited, JSON-based, Supabase-stored)
 * 
 * ZERO paid APIs. UNLIMITED personalities. FUTURE-PROOF.
 */

export type VoiceType = 'female' | 'male';
export type EmotionType = 'happy' | 'sad' | 'angry' | 'neutral' | 'excited' | 'teasing' | 'flirty' | 'calm' | 'playful';
export type StyleType = 'casual' | 'formal' | 'playful' | 'serious' | 'sarcastic' | 'sweet' | 'energetic';

/**
 * Dynamic personality - unlimited, created/modified at runtime, stored in Supabase
 */
export interface DynamicPersonality {
  // Metadata
  name: string;
  description?: string;
  createdAt: number; // timestamp
  lastUsed?: number; // timestamp
  usageCount: number;

  // Voice characteristics
  pitch: number; // 0.5-2.0 (multiplier for TTS SSML)
  speed: number; // 0.5-2.0 (speech rate)
  volume: number; // 0-1

  // Emotional/stylistic
  tone: string; // description for TTS voice selection
  emotion: EmotionType;
  style: StyleType;

  // Additional context
  tags?: string[]; // user-defined tags
  parentPersonality?: string; // if derived from another
}

/**
 * Complete voice configuration - stored in Supabase
 * Supports unlimited dynamic personalities
 */
export interface VoiceConfig {
  userId: string;
  currentVoice: VoiceType;
  currentPersonality: string; // name of active personality
  
  // All personalities stored as key-value map (unlimited)
  personalities: Record<string, DynamicPersonality>;
  
  // Wake words per voice
  wakeWords: {
    female: string;
    male: string;
  };
  
  // Global voice settings
  globalVolume: number; // 0-1
  
  // Learning/adaptation data
  moodHistory?: Array<{
    timestamp: number;
    mood: string;
    selectedPersonality: string;
    duration: number;
  }>;
  
  // Preferences
  autoAdaptEnabled: boolean;
  
  updatedAt: string;
}

/**
 * STT engine options
 */
export interface STTOptions {
  language?: string;
  timeout?: number;
}

/**
 * TTS engine options with dynamic personality
 */
export interface TTSOptions {
  text: string;
  voice: VoiceType;
  personality: DynamicPersonality;
  volume?: number;
}

/**
 * Wake word detection event
 */
export interface WakeWordEvent {
  timestamp: number;
  voice: VoiceType;
  wakeWord: string;
  confidence: number; // 0-1
}

/**
 * Voice command parsed from user input
 */
export interface ParsedVoiceCommand {
  intent: string; // 'create-personality', 'modify-personality', 'delete-personality', 'switch-personality', etc.
  parameters: Record<string, any>;
  confidence: number; // 0-1
}

/**
 * Personality creation request
 */
export interface PersonalityCreationRequest {
  name: string;
  basePersonality?: string; // optional: derive from existing
  pitch?: number;
  speed?: number;
  volume?: number;
  tone?: string;
  emotion?: EmotionType;
  style?: StyleType;
  description?: string;
}

/**
 * Personality modification request
 */
export interface PersonalityModificationRequest {
  name: string;
  changes: Partial<Omit<DynamicPersonality, 'name' | 'createdAt'>>;
}

/**
 * Base voice engine interface
 */
export interface VoiceEngine {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
  isReady(): boolean;
}

/**
 * STT engine interface (Vosk-based, local, free)
 */
export interface STTEngine extends VoiceEngine {
  recognize(options?: STTOptions): Promise<string>;
  startContinuous(onResult: (text: string) => void): Promise<void>;
  stopContinuous(): Promise<void>;
}

/**
 * TTS engine interface (Piper-based with SSML, local, free)
 */
export interface TTSEngine extends VoiceEngine {
  speak(options: TTSOptions): Promise<void>;
  synthesize(options: TTSOptions): Promise<Buffer>;
  stop(): Promise<void>;
}

/**
 * Wake word detector interface (OpenWakeWord, local, free)
 */
export interface WakeWordDetector extends VoiceEngine {
  startListening(
    wakeWords: Map<VoiceType, string>,
    onDetected: (event: WakeWordEvent) => void
  ): Promise<void>;
  stopListening(): Promise<void>;
  updateWakeWord(voice: VoiceType, newWakeWord: string): Promise<void>;
  trainCustomWakeWord(wakeWord: string): Promise<void>;
}

/**
 * Voice system events
 */
export interface VoiceSystemEvents {
  'wake-word-detected': WakeWordEvent;
  'listening-started': { voice: VoiceType };
  'listening-stopped': void;
  'speech-recognized': { text: string; confidence: number };
  'speech-start': void;
  'speech-end': void;
  'personality-created': { personality: DynamicPersonality };
  'personality-changed': { newPersonality: DynamicPersonality };
  'personality-modified': { personality: DynamicPersonality };
  'personality-deleted': { name: string };
  'voice-switched': { newVoice: VoiceType };
  'wake-word-changed': { voice: VoiceType; newWakeWord: string };
  'config-updated': VoiceConfig;
  'error': { error: Error; context: string };
}
