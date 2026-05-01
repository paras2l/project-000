/// <reference types="node" />

/**
 * Voice Configuration Manager for NATSU
 * Handles: Supabase config storage, command parsing, runtime updates
 * All settings are configurable via voice commands - NO hardcoded values
 */

import { EventEmitter } from 'events';
import { VoiceConfig, ParsedVoiceCommand, VoiceType, PersonalityType } from './types';

/**
 * VoiceConfigManager: Manages NATSU voice configuration
 * Syncs with Supabase for cross-device persistence
 */
export class VoiceConfigManager extends EventEmitter {
  private userId: string;
  private config: VoiceConfig | null = null;
  private isInitialized = false;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(userId: string) {
    super();
    this.userId = userId;
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseKey = process.env.SUPABASE_KEY || '';

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('[VoiceConfig] Supabase credentials not set - config won\'t persist');
    }
  }

  /**
   * Initialize config manager - load config from Supabase
   */
  async initialize(): Promise<void> {
    try {
      // TODO: load config from Supabase
      // If not found, create default config
      this.config = await this.loadConfigFromSupabase();

      if (!this.config) {
        this.config = this.getDefaultConfig();
        await this.saveConfigToSupabase(this.config);
      }

      this.isInitialized = true;
      console.log('[VoiceConfig] Initialized with config:', this.config);
    } catch (error) {
      console.error('[VoiceConfig] Initialization failed:', error);
      // Fall back to default config
      this.config = this.getDefaultConfig();
      this.isInitialized = true;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): VoiceConfig {
    if (!this.isInitialized || !this.config) {
      throw new Error('VoiceConfigManager not initialized');
    }
    return this.config;
  }

  /**
   * Update configuration with partial changes
   */
  async updateConfig(changes: Partial<VoiceConfig>): Promise<void> {
    if (!this.isInitialized || !this.config) {
      throw new Error('VoiceConfigManager not initialized');
    }

    try {
      const updatedConfig: VoiceConfig = {
        ...this.config,
        ...changes,
        updatedAt: new Date().toISOString(),
      };

      await this.saveConfigToSupabase(updatedConfig);
      this.config = updatedConfig;

      // Emit change event for each updated field
      Object.entries(changes).forEach(([key, value]) => {
        this.emit('config-changed', { key, newValue: value, oldValue: this.config?.[key as keyof VoiceConfig] });
      });

      console.log('[VoiceConfig] Config updated:', changes);
    } catch (error) {
      this.emit('error', { error, context: 'updateConfig' });
      throw error;
    }
  }

  /**
   * Parse voice command and extract intent + parameters
   * Examples:
   *   "Change wake word to hey bestie" → { intent: 'change-wake-word', parameters: { newWakeWord: 'hey bestie' } }
   *   "Switch to male voice" → { intent: 'switch-voice', parameters: { voice: 'male' } }
   *   "Be more professional" → { intent: 'set-personality', parameters: { personality: 'professional' } }
   *   "Turn up volume" → { intent: 'adjust-volume', parameters: { delta: 0.1 } }
   */
  parseVoiceCommand(text: string): ParsedVoiceCommand {
    const lowerText = text.toLowerCase().trim();

    // Change wake word: "change wake word to X"
    const changeWakeWordMatch = lowerText.match(/change\s+wake\s+word\s+to\s+['"]?([^'"]+)['"]?/i);
    if (changeWakeWordMatch) {
      return {
        intent: 'change-wake-word',
        parameters: { newWakeWord: changeWakeWordMatch[1].trim() },
        confidence: 0.9,
      };
    }

    // Switch voice: "switch to male/female voice"
    const switchVoiceMatch = lowerText.match(/switch\s+to\s+(male|female)\s+voice/i);
    if (switchVoiceMatch) {
      return {
        intent: 'switch-voice',
        parameters: { voice: switchVoiceMatch[1] as VoiceType },
        confidence: 0.95,
      };
    }

    // Set personality: "be more/less X" or "set personality to X"
    const personalityMatch = lowerText.match(/(?:be\s+(?:more|less|very)?|set\s+personality\s+to)\s+(cute|warm|professional|energetic|calm)/i);
    if (personalityMatch) {
      return {
        intent: 'set-personality',
        parameters: { personality: personalityMatch[1] as PersonalityType },
        confidence: 0.9,
      };
    }

    // Volume control: "volume X" or "turn (up|down) volume"
    const volumeMatch = lowerText.match(/(?:volume|turn\s+(up|down)\s+volume)\s*(\d+)?/i);
    if (volumeMatch) {
      let delta = 0;
      if (volumeMatch[1] === 'up') delta = 0.1;
      else if (volumeMatch[1] === 'down') delta = -0.1;
      else if (volumeMatch[2]) delta = parseInt(volumeMatch[2]) / 100;

      return {
        intent: 'adjust-volume',
        parameters: { delta },
        confidence: 0.85,
      };
    }

    // Pitch control: "increase/decrease pitch"
    const pitchMatch = lowerText.match(/(increase|decrease)\s+pitch/i);
    if (pitchMatch) {
      return {
        intent: 'adjust-pitch',
        parameters: { delta: pitchMatch[1] === 'increase' ? 0.1 : -0.1 },
        confidence: 0.85,
      };
    }

    // Speed control: "speed up / slow down"
    const speedMatch = lowerText.match(/(speed\s+up|slow\s+down|faster|slower)/i);
    if (speedMatch) {
      const delta = speedMatch[1].includes('up') || speedMatch[1].includes('faster') ? 0.1 : -0.1;
      return {
        intent: 'adjust-speed',
        parameters: { delta },
        confidence: 0.85,
      };
    }

    // Unknown command
    return {
      intent: 'unknown',
      parameters: { text },
      confidence: 0.0,
    };
  }

  /**
   * Execute voice command by updating config
   */
  async executeVoiceCommand(command: ParsedVoiceCommand): Promise<void> {
    if (!this.isInitialized || !this.config) {
      throw new Error('VoiceConfigManager not initialized');
    }

    const { intent, parameters } = command;

    try {
      switch (intent) {
        case 'change-wake-word': {
          const voice = this.config.currentVoice;
          const field = voice === 'female' ? 'femaleWakeWord' : 'maleWakeWord';
          await this.updateConfig({
            [field]: parameters.newWakeWord,
          } as Partial<VoiceConfig>);
          break;
        }

        case 'switch-voice': {
          await this.updateConfig({ currentVoice: parameters.voice });
          break;
        }

        case 'set-personality': {
          await this.updateConfig({ personality: parameters.personality });
          break;
        }

        case 'adjust-volume': {
          const newVolume = Math.max(0, Math.min(1, this.config.volume + parameters.delta));
          await this.updateConfig({ volume: newVolume });
          break;
        }

        case 'adjust-pitch': {
          const newPitch = Math.max(0.5, Math.min(2.0, this.config.pitch + parameters.delta));
          await this.updateConfig({ pitch: newPitch });
          break;
        }

        case 'adjust-speed': {
          const newSpeed = Math.max(0.5, Math.min(2.0, this.config.speed + parameters.delta));
          await this.updateConfig({ speed: newSpeed });
          break;
        }

        case 'unknown': {
          console.log('[VoiceConfig] Unknown command:', parameters.text);
          break;
        }
      }
    } catch (error) {
      this.emit('error', { error, context: `executeVoiceCommand: ${intent}` });
      throw error;
    }
  }

  /**
   * Load config from Supabase
   */
  private async loadConfigFromSupabase(): Promise<VoiceConfig | null> {
    try {
      if (!this.supabaseUrl || !this.supabaseKey) {
        console.warn('[VoiceConfig] Supabase not configured');
        return null;
      }

      // TODO: implement Supabase fetch
      // SELECT * FROM voice_configs WHERE user_id = userId
      console.log('[VoiceConfig] Loading config from Supabase for user:', this.userId);

      return null; // stub
    } catch (error) {
      console.error('[VoiceConfig] Failed to load from Supabase:', error);
      return null;
    }
  }

  /**
   * Save config to Supabase
   */
  private async saveConfigToSupabase(config: VoiceConfig): Promise<void> {
    try {
      if (!this.supabaseUrl || !this.supabaseKey) {
        console.warn('[VoiceConfig] Supabase not configured - config not persisted');
        return;
      }

      // TODO: implement Supabase upsert
      // UPSERT INTO voice_configs (user_id, config_json) VALUES (userId, config)
      console.log('[VoiceConfig] Saving config to Supabase for user:', this.userId);
    } catch (error) {
      console.error('[VoiceConfig] Failed to save to Supabase:', error);
      throw error;
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): VoiceConfig {
    return {
      userId: this.userId,
      currentVoice: 'female',
      femaleWakeWord: 'natsu',
      maleWakeWord: 'natsu',
      personality: 'cute',
      volume: 0.8,
      pitch: 1.0,
      speed: 1.0,
      enableAutoPersonality: false,
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Export factory function
 */
export function createVoiceConfigManager(userId: string): VoiceConfigManager {
  return new VoiceConfigManager(userId);
}
