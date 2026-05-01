/// <reference types="node" />

/**
 * Voice Configuration Manager for NATSU (FREE system)
 * 
 * Handles:
 * - Supabase config storage
 * - Dynamic personality command parsing
 * - NO hardcoded personalities
 * - All config as JSON in database
 */

import { EventEmitter } from 'events';
import { VoiceConfig, ParsedVoiceCommand, VoiceType, PersonalityCreationRequest } from '../types-new';
import { PersonalityEngine } from './personality-engine';

/**
 * VoiceConfigManager: Manages NATSU configuration
 * Stores everything in Supabase - nothing hardcoded
 */
export class VoiceConfigManager extends EventEmitter {
  private userId: string;
  private config: VoiceConfig | null = null;
  private isInitialized = false;
  private supabaseUrl: string;
  private supabaseKey: string;
  private personalityEngine: PersonalityEngine;

  constructor(userId: string, personalityEngine: PersonalityEngine) {
    super();
    this.userId = userId;
    this.personalityEngine = personalityEngine;
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseKey = process.env.SUPABASE_KEY || '';

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('[VoiceConfig] Supabase credentials not set - using local storage only');
    }
  }

  /**
   * Initialize config manager
   */
  async initialize(): Promise<void> {
    try {
      // Load config from Supabase
      this.config = await this.loadConfigFromSupabase();

      if (!this.config) {
        this.config = this.getDefaultConfig();
        await this.saveConfigToSupabase(this.config);
      }

      // Load personalities into engine
      this.personalityEngine.loadPersonalities(this.config.personalities);

      this.isInitialized = true;
      console.log('[VoiceConfig] Initialized with', Object.keys(this.config.personalities).length, 'personalities');
    } catch (error) {
      console.error('[VoiceConfig] Initialization failed:', error);
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
   * Update configuration
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

      this.emit('config-updated', this.config);
      console.log('[VoiceConfig] Config updated');
    } catch (error) {
      this.emit('error', { error, context: 'updateConfig' });
      throw error;
    }
  }

  /**
   * Parse voice command for dynamic personality system
   * Examples:
   *   "Create flirty personality" → create new personality
   *   "Create playful personality with high pitch" → specific params
   *   "Delete professional personality" → delete personality
   *   "Modify cute to be more teasing" → modify existing
   *   "Switch to flirty personality" → change active personality
   */
  parseVoiceCommand(text: string): ParsedVoiceCommand {
    const lower = text.toLowerCase().trim();

    // Create personality: "Create X personality [with params]"
    const createMatch = lower.match(/create\s+(\w+)\s+personality(?:\s+with\s+(.+))?/i);
    if (createMatch) {
      return {
        intent: 'create-personality',
        parameters: {
          name: createMatch[1],
          description: createMatch[2] || undefined,
        },
        confidence: 0.95,
      };
    }

    // Delete personality: "Delete X personality"
    const deleteMatch = lower.match(/delete\s+(\w+)\s+personality/i);
    if (deleteMatch) {
      return {
        intent: 'delete-personality',
        parameters: { name: deleteMatch[1] },
        confidence: 0.95,
      };
    }

    // Modify personality: "Make/Modify X more/less Y" or "Modify X to be Y"
    const modifyMatch = lower.match(/(?:make|modify)\s+(\w+)\s+(?:more|less|to be)\s+(.+)/i);
    if (modifyMatch) {
      return {
        intent: 'modify-personality',
        parameters: {
          name: modifyMatch[1],
          description: modifyMatch[2],
        },
        confidence: 0.9,
      };
    }

    // Switch personality: "Switch to X" or "Use X personality" or "Be X"
    const switchMatch = lower.match(/(?:switch to|use|be)\s+(\w+)(?:\s+personality)?/i);
    if (switchMatch) {
      return {
        intent: 'switch-personality',
        parameters: { name: switchMatch[1] },
        confidence: 0.9,
      };
    }

    // Change wake word: "Change wake word to X"
    const wakeWordMatch = lower.match(/change\s+wake\s+word\s+to\s+['"]?([^'"]+)['"]?/i);
    if (wakeWordMatch) {
      return {
        intent: 'change-wake-word',
        parameters: { newWakeWord: wakeWordMatch[1].trim() },
        confidence: 0.9,
      };
    }

    // Switch voice: "Switch to male/female voice"
    const switchVoiceMatch = lower.match(/switch\s+to\s+(male|female)\s+voice/i);
    if (switchVoiceMatch) {
      return {
        intent: 'switch-voice',
        parameters: { voice: switchVoiceMatch[1] as VoiceType },
        confidence: 0.95,
      };
    }

    // Volume control
    const volumeMatch = lower.match(/(?:set\s+)?volume\s+(?:to\s+)?(\d+)|turn\s+(up|down)\s+volume/i);
    if (volumeMatch) {
      let delta = 0;
      if (volumeMatch[2] === 'up') delta = 0.1;
      else if (volumeMatch[2] === 'down') delta = -0.1;
      else if (volumeMatch[1]) delta = parseInt(volumeMatch[1]) / 100;

      return {
        intent: 'adjust-volume',
        parameters: { delta },
        confidence: 0.85,
      };
    }

    // Unknown
    return {
      intent: 'unknown',
      parameters: { text },
      confidence: 0.0,
    };
  }

  /**
   * Execute parsed voice command
   */
  async executeVoiceCommand(command: ParsedVoiceCommand): Promise<void> {
    if (!this.isInitialized || !this.config) {
      throw new Error('VoiceConfigManager not initialized');
    }

    const { intent, parameters } = command;

    try {
      switch (intent) {
        case 'create-personality': {
          const request: PersonalityCreationRequest = {
            name: parameters.name,
            description: parameters.description,
          };

          if (parameters.description) {
            // Try to infer emotion/style from description
            await this.personalityEngine.createFromDescription(parameters.description);
          } else {
            // Create with defaults
            await this.personalityEngine.createPersonality(request);
          }

          // Save to config
          const updated = this.personalityEngine.exportPersonalities();
          await this.updateConfig({ personalities: updated });
          break;
        }

        case 'delete-personality': {
          await this.personalityEngine.deletePersonality(parameters.name);
          const updated = this.personalityEngine.exportPersonalities();
          await this.updateConfig({ personalities: updated });
          break;
        }

        case 'modify-personality': {
          const personality = this.personalityEngine.getPersonality(parameters.name);
          if (!personality) {
            throw new Error(`Personality "${parameters.name}" not found`);
          }

          // Infer modifications from description
          await this.personalityEngine.createFromDescription(parameters.description);

          const updated = this.personalityEngine.exportPersonalities();
          await this.updateConfig({ personalities: updated });
          break;
        }

        case 'switch-personality': {
          const personality = this.personalityEngine.getPersonality(parameters.name);
          if (!personality) {
            throw new Error(`Personality "${parameters.name}" not found`);
          }

          await this.updateConfig({ currentPersonality: parameters.name });
          break;
        }

        case 'change-wake-word': {
          const voice = this.config.currentVoice;
          const wakeWords = { ...this.config.wakeWords };
          wakeWords[voice] = parameters.newWakeWord;
          await this.updateConfig({ wakeWords });
          break;
        }

        case 'switch-voice': {
          await this.updateConfig({ currentVoice: parameters.voice });
          break;
        }

        case 'adjust-volume': {
          const newVolume = Math.max(0, Math.min(1, this.config.globalVolume + parameters.delta));
          await this.updateConfig({ globalVolume: newVolume });
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

      // TODO: Implement Supabase fetch
      // SELECT * FROM voice_configs WHERE user_id = userId LIMIT 1
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

      // TODO: Implement Supabase upsert
      // UPSERT INTO voice_configs (user_id, config) VALUES (userId, config)
      console.log('[VoiceConfig] Saving config to Supabase');
    } catch (error) {
      console.error('[VoiceConfig] Failed to save to Supabase:', error);
      throw error;
    }
  }

  /**
   * Get default configuration with NO hardcoded personalities
   * System ships with empty personalities map - user creates their own
   */
  private getDefaultConfig(): VoiceConfig {
    return {
      userId: this.userId,
      currentVoice: 'female',
      currentPersonality: 'default', // will be created below
      personalities: {
        default: {
          name: 'default',
          description: 'Default personality (neutral)',
          createdAt: Date.now(),
          usageCount: 0,
          pitch: 1.0,
          speed: 1.0,
          volume: 1.0,
          tone: 'neutral',
          emotion: 'neutral',
          style: 'casual',
        },
      },
      wakeWords: {
        female: 'natsu',
        male: 'natsu',
      },
      globalVolume: 0.8,
      autoAdaptEnabled: false,
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Factory function
 */
export function createVoiceConfigManager(userId: string, personalityEngine: PersonalityEngine): VoiceConfigManager {
  return new VoiceConfigManager(userId, personalityEngine);
}
