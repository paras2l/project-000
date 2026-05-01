/// <reference types="node" />

/**
 * NATSU Voice Manager - FREE System Orchestrator
 * 
 * Unified control of:
 * - Vosk STT (local speech recognition)
 * - Piper TTS (local text-to-speech)
 * - OpenWakeWord (custom wake words)
 * - Personality Engine (unlimited personalities)
 * - Voice Config (Supabase JSON storage)
 * 
 * COMPLETELY FREE - NO PAID SERVICES
 */

import { EventEmitter } from 'events';
import { VoiceConfig, VoiceType } from '../types-new';
import { VoskSTT } from './engines/vosk-stt';
import { PiperTTS } from './engines/piper-tts';
import { OpenWakeWordDetector } from './engines/openwakeword';
import { PersonalityEngine } from './personality-engine';
import { VoiceConfigManager } from './voice-config-free';

/**
 * VoiceManager: Main orchestrator for NATSU voice system
 */
export class VoiceManager extends EventEmitter {
  private sttEngine: VoskSTT;
  private ttsEngine: PiperTTS;
  private wakeWordDetector: OpenWakeWordDetector;
  private personalityEngine: PersonalityEngine;
  private configManager: VoiceConfigManager;

  private isInitialized = false;
  private isListening = false;
  private config: VoiceConfig | null = null;

  constructor(userId: string) {
    super();
    this.sttEngine = new VoskSTT();
    this.ttsEngine = new PiperTTS();
    this.wakeWordDetector = new OpenWakeWordDetector();
    this.personalityEngine = new PersonalityEngine();
    this.configManager = new VoiceConfigManager(userId, this.personalityEngine);

    this.setupEventListeners();
  }

  /**
   * Initialize all engines
   */
  async initialize(): Promise<void> {
    try {
      console.log('[VoiceManager] Initializing...');

      // Initialize config first
      await this.configManager.initialize();
      this.config = this.configManager.getConfig();

      // Initialize all engines
      await Promise.all([
        this.sttEngine.initialize(),
        this.ttsEngine.initialize(),
        this.wakeWordDetector.initialize(),
      ]);

      this.isInitialized = true;
      this.emit('initialized');

      console.log('[VoiceManager] Initialized successfully');
    } catch (error) {
      this.emit('error', { error, context: 'VoiceManager initialization' });
      throw error;
    }
  }

  /**
   * Cleanup all engines
   */
  async cleanup(): Promise<void> {
    if (this.isListening) {
      await this.stopListening();
    }

    await Promise.all([this.sttEngine.cleanup(), this.ttsEngine.cleanup(), this.wakeWordDetector.cleanup()]);

    this.isInitialized = false;
    console.log('[VoiceManager] Cleaned up');
  }

  /**
   * Start listening for wake words
   */
  async startListening(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('VoiceManager not initialized');
    }

    if (this.isListening) {
      return; // Already listening
    }

    try {
      console.log('[VoiceManager] Starting to listen for wake words...');

      this.isListening = true;

      // Prepare wake words map
      const wakeWords = new Map<VoiceType, string>([
        ['female', this.config!.wakeWords.female],
        ['male', this.config!.wakeWords.male],
      ]);

      // Start listening for wake words
      await this.wakeWordDetector.startListening(wakeWords, (event) => {
        this.handleWakeWordDetected(event);
      });

      this.emit('listening');
    } catch (error) {
      this.isListening = false;
      this.emit('error', { error, context: 'startListening' });
      throw error;
    }
  }

  /**
   * Stop listening
   */
  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      await this.wakeWordDetector.stopListening();
      this.isListening = false;
      console.log('[VoiceManager] Stopped listening');
    } catch (error) {
      this.emit('error', { error, context: 'stopListening' });
      throw error;
    }
  }

  /**
   * Speak text with current personality
   */
  async speak(text: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('VoiceManager not initialized');
    }

    try {
      const personality = this.personalityEngine.getPersonality(this.config!.currentPersonality);
      if (!personality) {
        throw new Error(`Personality "${this.config!.currentPersonality}" not found`);
      }

      await this.ttsEngine.speak({
        text,
        voice: this.config!.currentVoice,
        personality,
        volume: this.config!.globalVolume,
      });
    } catch (error) {
      this.emit('error', { error, context: 'speak' });
      throw error;
    }
  }

  /**
   * Recognize speech and handle voice commands
   */
  async recognizeAndExecute(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('VoiceManager not initialized');
    }

    try {
      console.log('[VoiceManager] Listening for speech input...');

      // TODO: Implement continuous speech recognition with Vosk
      // 1. Start listening for speech
      // 2. Accumulate speech frames
      // 3. When silence detected, process result
      // 4. Parse as voice command
      // 5. Execute command

      this.emit('recognition-started');
    } catch (error) {
      this.emit('error', { error, context: 'recognizeAndExecute' });
      throw error;
    }
  }

  /**
   * Handle wake word detection
   */
  private handleWakeWordDetected(event: any): void {
    console.log('[VoiceManager] Wake word detected:', event.wakeWord, 'confidence:', event.confidence);

    this.emit('wake-word-detected', event);

    // TODO: Start speech recognition
    // 1. Listen for command after wake word
    // 2. Timeout after X seconds if no speech
  }

  /**
   * Switch to different personality
   */
  async switchPersonality(name: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('VoiceManager not initialized');
    }

    try {
      const personality = this.personalityEngine.getPersonality(name);
      if (!personality) {
        throw new Error(`Personality "${name}" not found`);
      }

      await this.configManager.updateConfig({ currentPersonality: name });
      this.config = this.configManager.getConfig();

      console.log('[VoiceManager] Switched to personality:', name);
      this.emit('personality-switched', { name });
    } catch (error) {
      this.emit('error', { error, context: 'switchPersonality' });
      throw error;
    }
  }

  /**
   * Switch voice (male/female)
   */
  async switchVoice(voice: VoiceType): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('VoiceManager not initialized');
    }

    try {
      await this.configManager.updateConfig({ currentVoice: voice });
      this.config = this.configManager.getConfig();

      console.log('[VoiceManager] Switched to voice:', voice);
      this.emit('voice-switched', { voice });
    } catch (error) {
      this.emit('error', { error, context: 'switchVoice' });
      throw error;
    }
  }

  /**
   * Set personality by name
   */
  setPersonality(name: string): void {
    const personality = this.personalityEngine.getPersonality(name);
    if (!personality) {
      throw new Error(`Personality "${name}" not found`);
    }

    this.config!.currentPersonality = name;
    console.log('[VoiceManager] Personality set to:', name);
  }

  /**
   * Handle voice command
   */
  async handleCommand(text: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('VoiceManager not initialized');
    }

    try {
      console.log('[VoiceManager] Handling command:', text);

      // Parse command
      const command = this.configManager.parseVoiceCommand(text);

      if (command.confidence < 0.5) {
        console.warn('[VoiceManager] Low confidence command, ignoring');
        return;
      }

      // Execute command
      await this.configManager.executeVoiceCommand(command);

      // Update local config
      this.config = this.configManager.getConfig();

      this.emit('command-executed', { command, success: true });
    } catch (error) {
      this.emit('error', { error, context: 'handleCommand' });
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): VoiceConfig {
    if (!this.config) {
      throw new Error('VoiceManager not initialized');
    }
    return this.config;
  }

  /**
   * Get all personalities
   */
  getPersonalities() {
    return this.personalityEngine.getAllPersonalities();
  }

  /**
   * Get current personality
   */
  getCurrentPersonality() {
    if (!this.config) {
      throw new Error('VoiceManager not initialized');
    }
    return this.personalityEngine.getPersonality(this.config.currentPersonality);
  }

  /**
   * Setup event listener forwarding
   */
  private setupEventListeners(): void {
    // Engine errors
    this.sttEngine.on('error', (e) => this.emit('stt-error', e));
    this.ttsEngine.on('error', (e) => this.emit('tts-error', e));
    this.wakeWordDetector.on('error', (e) => this.emit('wake-word-error', e));

    // Personality changes
    this.personalityEngine.on('personality-created', (e) => this.emit('personality-created', e));
    this.personalityEngine.on('personality-modified', (e) => this.emit('personality-modified', e));
    this.personalityEngine.on('personality-deleted', (e) => this.emit('personality-deleted', e));

    // Config changes
    this.configManager.on('config-updated', (config) => {
      this.config = config;
      this.emit('config-updated', config);
    });
  }
}

/**
 * Factory function
 */
export function createVoiceManager(userId: string): VoiceManager {
  return new VoiceManager(userId);
}
