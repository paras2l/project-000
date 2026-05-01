/**
 * Personality system for NATSU voice
 * Defines voice characteristics for each personality type
 */

import { PersonalityType, PersonalitySettings } from './types';

/**
 * Personality presets for NATSU voice
 * Each personality adjusts: pitch, rate, tone
 */
export const PERSONALITY_PRESETS: Record<PersonalityType, PersonalitySettings> = {
  cute: {
    pitch: 1.3, // higher pitch
    rate: 1.1, // slightly faster
    tone: 'playful',
    description: 'Cute, sweet, bestie vibe - teasing and joking',
  },
  warm: {
    pitch: 1.1,
    rate: 0.95,
    tone: 'gentle',
    description: 'Warm, friendly, supportive tone',
  },
  professional: {
    pitch: 0.95,
    rate: 0.9,
    tone: 'formal',
    description: 'Professional, clear, articulate',
  },
  energetic: {
    pitch: 1.2,
    rate: 1.3,
    tone: 'enthusiastic',
    description: 'Energetic, upbeat, enthusiastic',
  },
  calm: {
    pitch: 0.85,
    rate: 0.75,
    tone: 'soothing',
    description: 'Calm, relaxed, meditative',
  },
};

/**
 * Voice model mappings for TTS
 * Maps voice type to preferred providers and voice IDs
 */
export const VOICE_MODELS = {
  female: {
    elevenlabs: 'Rachel', // anime-style female voice
    openai: 'nova', // cute/warm female voice
  },
  male: {
    openai: 'onyx', // deep male voice
    fallback: 'echo', // alternative deep voice
  },
};

/**
 * Get personality settings for a given type
 */
export function getPersonalitySettings(personality: PersonalityType): PersonalitySettings {
  return PERSONALITY_PRESETS[personality];
}

/**
 * Apply personality adjustments to TTS parameters
 * Combines base voice settings with personality modifiers
 */
export function applyPersonalityToSettings(
  baseSettings: { pitch: number; rate: number; volume: number },
  personality: PersonalityType
): { pitch: number; rate: number; volume: number } {
  const preset = getPersonalitySettings(personality);

  return {
    pitch: baseSettings.pitch * preset.pitch,
    rate: baseSettings.rate * preset.rate,
    volume: baseSettings.volume, // personality doesn't affect volume
  };
}

/**
 * Auto-detect personality based on context
 * TODO: implement ML model for automatic personality detection
 */
export function autoDetectPersonality(context: {
  time?: number; // hour of day
  sentiment?: string; // user emotion
  topic?: string; // conversation topic
}): PersonalityType {
  // Stub for auto-personality detection
  // In future: analyze user input sentiment, time of day, topic
  // For now: return 'warm' as default
  return 'warm';
}
