/**
 * NATSU Flexible Configuration System
 * 
 * NO hardcoding - all values configurable at runtime
 * Inspired by ha-openwakeword repository-based distribution
 * 
 * Users can:
 * - Change wake words dynamically
 * - Switch TTS providers
 * - Adjust audio parameters
 * - Load models from any GitHub repo
 */

export interface NatsuConfig {
  // App settings
  appVersion: string;
  debugMode: boolean;

  // Wake word settings (NO HARDCODING)
  wakeWord: {
    enabled: boolean;
    phrases: string[]; // ["natsu", "hey natsu", "ok natsu"]
    sensitivity: number; // 0.0-1.0
    confidenceThreshold: number; // 0.75-0.99
    continuousListening: boolean; // 24/7
  };

  // Voice settings
  voice: {
    engine: 'kokoro' | 'webspeech' | 'custom';
    defaultGender: 'male' | 'female' | 'neutral';
    defaultAge: number; // 18-80
    defaultEmotion: 'happy' | 'sad' | 'neutral' | 'angry' | 'excited';
    defaultAccent: 'american' | 'british' | 'french' | 'indian' | 'neutral';
    speed: number; // 0.5-2.0
    pitch: number; // 0.5-2.0
    volume: number; // 0-1
  };

  // Model sources (FLEXIBLE - any GitHub repo)
  modelSources: {
    wakeWordModels: string; // GitHub repo URL
    voiceModels: string; // GitHub repo URL
    updateInterval: number; // milliseconds
  };

  // Audio settings
  audio: {
    sampleRate: number; // 8000, 16000, 44100
    fftSize: number; // 512, 1024, 2048
    windowSize: number; // for spectrogram
    noiseThreshold: number; // -40 to 0 dB
  };

  // Personalization
  personalization: {
    userId: string;
    userName: string;
    preferredLanguage: string;
    timezone: string;
  };

  // Advanced
  advanced: {
    useCpuOptimizations: boolean;
    streamingMode: boolean;
    enableInterruptionHandling: boolean;
    maxConcurrentUtterances: number;
  };
}

/**
 * Get default NATSU configuration
 * Can be overridden by environment or user settings
 */
export function getDefaultConfig(): NatsuConfig {
  return {
    appVersion: '1.0.0',
    debugMode: process.env.NODE_ENV === 'development',

    wakeWord: {
      enabled: true,
      phrases: ['natsu', 'hey natsu', 'ok natsu'],
      sensitivity: 0.5, // Medium sensitivity
      confidenceThreshold: 0.85,
      continuousListening: true, // 24/7
    },

    voice: {
      engine: 'kokoro',
      defaultGender: 'female',
      defaultAge: 25,
      defaultEmotion: 'neutral',
      defaultAccent: 'american',
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8,
    },

    modelSources: {
      wakeWordModels: 'https://github.com/fwartner/openwakeword-models.git',
      voiceModels: 'https://github.com/Project-NATSU/voice-models.git',
      updateInterval: 24 * 60 * 60 * 1000, // Daily
    },

    audio: {
      sampleRate: 16000,
      fftSize: 1024,
      windowSize: 512,
      noiseThreshold: -40,
    },

    personalization: {
      userId: 'user-' + Date.now(),
      userName: 'User',
      preferredLanguage: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },

    advanced: {
      useCpuOptimizations: true,
      streamingMode: true,
      enableInterruptionHandling: true,
      maxConcurrentUtterances: 1,
    },
  };
}

/**
 * Load config from localStorage (web/mobile)
 */
export function loadConfigFromStorage(): NatsuConfig {
  try {
    const stored = localStorage.getItem('natsu-config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return getDefaultConfig();
}

/**
 * Save config to localStorage
 */
export function saveConfigToStorage(config: NatsuConfig): void {
  try {
    localStorage.setItem('natsu-config', JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

/**
 * Merge user config with defaults (no hardcoding, easy override)
 */
export function mergeConfig(userConfig: Partial<NatsuConfig>): NatsuConfig {
  const defaults = getDefaultConfig();
  return {
    ...defaults,
    ...userConfig,
    wakeWord: { ...defaults.wakeWord, ...userConfig.wakeWord },
    voice: { ...defaults.voice, ...userConfig.voice },
    modelSources: { ...defaults.modelSources, ...userConfig.modelSources },
    audio: { ...defaults.audio, ...userConfig.audio },
    personalization: { ...defaults.personalization, ...userConfig.personalization },
    advanced: { ...defaults.advanced, ...userConfig.advanced },
  };
}

/**
 * Validate config values
 */
export function validateConfig(config: NatsuConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.wakeWord.sensitivity < 0 || config.wakeWord.sensitivity > 1) {
    errors.push('Wake word sensitivity must be 0-1');
  }

  if (config.wakeWord.confidenceThreshold < 0.75 || config.wakeWord.confidenceThreshold > 0.99) {
    errors.push('Confidence threshold must be 0.75-0.99');
  }

  if (config.voice.speed < 0.5 || config.voice.speed > 2.0) {
    errors.push('Voice speed must be 0.5-2.0');
  }

  if (config.voice.pitch < 0.5 || config.voice.pitch > 2.0) {
    errors.push('Voice pitch must be 0.5-2.0');
  }

  if (config.voice.volume < 0 || config.voice.volume > 1) {
    errors.push('Voice volume must be 0-1');
  }

  if (config.audio.sampleRate < 8000 || config.audio.sampleRate > 48000) {
    errors.push('Sample rate must be 8000-48000');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Export config as JSON for sharing
 */
export function exportConfigAsJSON(config: NatsuConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Import config from JSON string
 */
export function importConfigFromJSON(jsonString: string): NatsuConfig {
  try {
    const parsed = JSON.parse(jsonString);
    return mergeConfig(parsed);
  } catch (error) {
    console.error('Failed to import config:', error);
    return getDefaultConfig();
  }
}
