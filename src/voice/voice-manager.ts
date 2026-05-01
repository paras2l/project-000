/// <reference types="node" />

/**
 * VoiceManager: Main orchestrator for NATSU's voice system
 * Coordinates: STT, TTS, Wake Word detection, Config management
 * Features: Dual voice system, personality-driven speech, command processing
 */

import { EventEmitter } from 'events';
import {
  VoiceType,
  PersonalityType,
  WakeWordEvent,
  TTSOptions,
  STTEngine,
  TTSEngine,
  WakeWordDetector,
} from './types';
import { VoiceConfigManager, createVoiceConfigManager } from './voice-config';
import { createSTTEngine } from './engines/stt-engine';
import { createTTSEngine } from './engines/tts-engine';
import { createWakeWordDetector } from './engines/wake-word';
import { autoDetectPersonality } from './personalities';

/**
 * Main Voice Manager class
 * Initializes and coordinates all voice subsystems
 */
export class VoiceManager extends EventEmitter {
  private userId: string;
  private configManager: VoiceConfigManager;
  private sttEngine: STTEngine;
  private ttsEngine: TTSEngine;
  private wakeWordDetector: WakeWordDetector;
  private isInitialized = false;
  private isListening = false;
  private isSpeaking = false;

  constructor(userId: string) {
    super();
    this.userId = userId;
    this.configManager = createVoiceConfigManager(userId);
    this.sttEngine = createSTTEngine('whisper');
    this.ttsEngine = createTTSEngine('openai');
    this.wakeWordDetector = createWakeWordDetector();
  }

  /**
   * Initialize all voice subsystems
   */
  async initialize(): Promise<void> {
    try {
      console.log('[VoiceManager] Initializing voice system for user:', this.userId);

      // Initialize config first (needed for other systems)
      await this.configManager.initialize();

      // Initialize engines in parallel
      await Promise.all([
        this.sttEngine.initialize(),
        this.ttsEngine.initialize(),
        this.wakeWordDetector.initialize(),
      ]);

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      this.emit('initialized');
      console.log('[VoiceManager] Voice system ready');
    } catch (error) {
      this.emit('error', { error, context: 'initialization' });
      throw error;
    }
  }

  /**
   * Clean up all voice subsystems
   */
  async cleanup(): Promise<void> {
    try {
      console.log('[VoiceManager] Cleaning up voice system');

      if (this.isListening) {
        await this.stopListening();
      }

      await Promise.all([
        this.sttEngine.cleanup(),
        this.ttsEngine.cleanup(),
        this.wakeWordDetector.cleanup(),
      ]);

      this.isInitialized = false;
      this.emit('cleaned-up');
    } catch (error) {
      this.emit('error', { error, context: 'cleanup' });
      throw error;
    }
  }

  /**
   * Start listening for wake word (always-on mode)
   * Runs in background with minimal CPU/battery usage
   */
  async startListening(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('VoiceManager not initialized');
    }

    if (this.isListening) {
      console.log('[VoiceManager] Already listening');
      return;
    }

    try {
      const config = this.configManager.getConfig();

      // Build wake word map from current config
      const wakeWords = new Map<VoiceType, string>();
      wakeWords.set('female', config.femaleWakeWord);
      wakeWords.set('male', config.maleWakeWord);

      // Start simultaneous listening for both voices
      await this.wakeWordDetector.startListening(
        wakeWords,
        this.onWakeWordDetected.bind(this)
      );

      this.isListening = true;
      this.emit('listening-started', { voice: config.currentVoice });
      console.log('[VoiceManager] Listening for wake words:', Array.from(wakeWords.entries()));
    } catch (error) {
      this.emit('error', { error, context: 'startListening' });
      throw error;
    }
  }

  /**
   * Stop listening for wake word
   */
  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      await this.wakeWordDetector.stopListening();
      this.isListening = false;
      this.emit('listening-stopped');
      console.log('[VoiceManager] Stopped listening');
    } catch (error) {
      this.emit('error', { error, context: 'stopListening' });
      throw error;
    }
  }

  /**
   * Wake word detected - trigger STT and command processing
   */
  private async onWakeWordDetected(event: WakeWordEvent): Promise<void> {
    try {
      console.log('[VoiceManager] Wake word detected:', event);
      this.emit('wake-word-detected', event);

      // Pause wake word detection while listening for speech
      await this.wakeWordDetector.stopListening();

      // Listen for user speech command
      console.log('[VoiceManager] Listening for command...');
      const speechText = await this.sttEngine.recognize();
      this.emit('speech-recognized', { text: speechText });

      // Parse and execute command
      const command = this.configManager.parseVoiceCommand(speechText);
      console.log('[VoiceManager] Parsed command:', command);

      if (command.confidence > 0.5) {
        // Execute the command
        await this.configManager.executeVoiceCommand(command);

        // Respond to user with confirmation
        const response = this.generateCommandResponse(command);
        await this.speak(response);
      } else {
        // Unknown command - ask for clarification
        await this.speak("Sorry, I didn't understand that. Could you repeat?");
      }

      // Resume wake word detection
      await this.startListening();
    } catch (error) {
      console.error('[VoiceManager] Error processing wake word:', error);
      this.emit('error', { error, context: 'wakeWordDetected' });

      // Resume listening despite error
      try {
        await this.startListening();
      } catch (resumeError) {
        console.error('[VoiceManager] Failed to resume listening:', resumeError);
      }
    }
  }

  /**
   * Speak text with current voice and personality
   */
  async speak(text: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('VoiceManager not initialized');
    }

    if (this.isSpeaking) {
      console.log('[VoiceManager] Already speaking, queuing message');
      // TODO: implement message queue for multiple speak() calls
    }

    try {
      this.isSpeaking = true;
      const config = this.configManager.getConfig();

      // Determine personality
      let personality = config.personality as PersonalityType;
      if (config.enableAutoPersonality) {
        personality = autoDetectPersonality({
          time: new Date().getHours(),
          sentiment: 'neutral', // TODO: sentiment analysis
        });
      }

      // Build TTS options
      const ttsOptions: TTSOptions = {
        text,
        voice: config.currentVoice,
        personality,
        volume: config.volume,
        pitch: config.pitch,
        speed: config.speed,
      };

      console.log('[VoiceManager] Speaking:', { text: text.substring(0, 50) + '...', personality });
      await this.ttsEngine.speak(ttsOptions);

      this.isSpeaking = false;
      this.emit('speech-complete');
    } catch (error) {
      this.isSpeaking = false;
      this.emit('error', { error, context: 'speak' });
      throw error;
    }
  }

  /**
   * Switch active voice (female/male)
   */
  async switchVoice(voice: VoiceType): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('VoiceManager not initialized');
    }

    try {
      await this.configManager.updateConfig({ currentVoice: voice });
      this.emit('voice-switched', { newVoice: voice });

      // Respond with new voice
      const responses: Record<VoiceType, string> = {
        female: "Switched to female voice!",
        male: "Switched to male voice!",
      };
      await this.speak(responses[voice]);
    } catch (error) {
      this.emit('error', { error, context: 'switchVoice' });
      throw error;
    }
  }

  /**
   * Set personality
   */
  async setPersonality(personality: PersonalityType): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('VoiceManager not initialized');
    }

    try {
      await this.configManager.updateConfig({ personality });
      this.emit('personality-changed', { newPersonality: personality });

      await this.speak(`Now speaking with a ${personality} personality.`);
    } catch (error) {
      this.emit('error', { error, context: 'setPersonality' });
      throw error;
    }
  }

  /**
   * Handle voice command from external source
   * Can be called programmatically instead of via wake word
   */
  async handleCommand(text: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('VoiceManager not initialized');
    }

    try {
      const command = this.configManager.parseVoiceCommand(text);
      console.log('[VoiceManager] Handling command:', command);

      if (command.confidence > 0.5) {
        await this.configManager.executeVoiceCommand(command);
        const response = this.generateCommandResponse(command);
        await this.speak(response);
      } else {
        await this.speak("Sorry, I didn't understand that.");
      }
    } catch (error) {
      this.emit('error', { error, context: 'handleCommand' });
      throw error;
    }
  }

  /**
   * Generate natural response to user command
   */
  private generateCommandResponse(command: any): string {
    const { intent, parameters } = command;

    switch (intent) {
      case 'change-wake-word':
        return `Wake word changed to "${parameters.newWakeWord}". I'll respond to that from now on.`;

      case 'switch-voice':
        return `Switched to ${parameters.voice} voice!`;

      case 'set-personality':
        return `I'll be more ${parameters.personality} now.`;

      case 'adjust-volume':
        return `Volume adjusted.`;

      case 'adjust-pitch':
        return `Pitch adjusted.`;

      case 'adjust-speed':
        return `Speaking speed adjusted.`;

      default:
        return 'Command executed.';
    }
  }

  /**
   * Set up internal event listeners
   */
  private setupEventListeners(): void {
    // Listen for config changes and sync wake words with detector
    this.configManager.on('config-changed', async (event: any) => {
      const { key, newValue } = event;

      if (key === 'femaleWakeWord' || key === 'maleWakeWord') {
        const voice = key === 'femaleWakeWord' ? 'female' : 'male';
        try {
          await this.wakeWordDetector.updateWakeWord(voice as VoiceType, newValue);
        } catch (error) {
          console.error('[VoiceManager] Failed to update wake word:', error);
        }
      }
    });

    // Forward engine errors
    this.sttEngine.on('error', (err) => this.emit('error', err));
    this.ttsEngine.on('error', (err) => this.emit('error', err));
    this.wakeWordDetector.on('error', (err) => this.emit('error', err));
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return this.configManager.getConfig();
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

/**
 * Export factory function
 */
export function createVoiceManager(userId: string): VoiceManager {
  return new VoiceManager(userId);
}
