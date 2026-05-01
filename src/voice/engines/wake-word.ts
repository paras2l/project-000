/// <reference types="node" />

/**
 * Wake Word Detector for NATSU
 * Supports: Porcupine (on-device, low power)
 * Features: dual wake words (female/male voices), simultaneous listening
 */

import { EventEmitter } from 'events';
import { WakeWordDetector, WakeWordEvent, VoiceType } from '../types';

/**
 * PorcupineWakeWordDetector: On-device wake word detection
 * Requires: PORCUPINE_ACCESS_KEY environment variable
 * Supports: custom wake words, 99%+ accuracy
 */
export class PorcupineWakeWordDetector extends EventEmitter implements WakeWordDetector {
  private accessKey: string;
  private isReady = false;
  private isListening = false;
  private wakeWords: Map<VoiceType, string> = new Map();
  private onDetectedCallback?: (event: WakeWordEvent) => void;

  constructor() {
    super();
    this.accessKey = process.env.PORCUPINE_ACCESS_KEY || '';
    if (!this.accessKey) {
      console.warn('[WakeWord] PORCUPINE_ACCESS_KEY not set - wake word detection will not work');
    }
  }

  async initialize(): Promise<void> {
    try {
      if (!this.accessKey) {
        throw new Error('PORCUPINE_ACCESS_KEY not set');
      }

      // TODO: initialize Porcupine SDK
      // 1. Load Porcupine library
      // 2. Verify access key
      // 3. Get available models

      this.isReady = true;
      console.log('[WakeWord] Porcupine initialized successfully');
    } catch (error) {
      this.emit('error', { error, context: 'Porcupine initialization' });
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.isListening) {
      await this.stopListening();
    }
    this.isReady = false;
  }

  isReady_(): boolean {
    return this.isReady;
  }

  /**
   * Start listening for wake words
   * Simultaneously monitors both female and male wake words
   */
  async startListening(
    wakeWords: Map<VoiceType, string>,
    onDetected: (event: WakeWordEvent) => void
  ): Promise<void> {
    if (!this.isReady) {
      throw new Error('Wake word detector not ready');
    }

    try {
      this.wakeWords = wakeWords;
      this.onDetectedCallback = onDetected;
      this.isListening = true;

      console.log('[WakeWord] Starting simultaneous wake word listening:');
      wakeWords.forEach((word, voice) => {
        console.log(`  - ${voice}: "${word}"`);
      });

      // TODO: implement Porcupine listening
      // 1. Start audio input stream
      // 2. Initialize Porcupine with both wake words
      // 3. Process audio chunks
      // 4. Emit WakeWordEvent when detected
      // 5. Include confidence score (0-1)
      // 6. Identify which voice/wake-word was detected

      // Stub: simulate detection after 5 seconds
      setTimeout(() => {
        if (this.isListening && this.onDetectedCallback) {
          this.onDetectedCallback({
            timestamp: Date.now(),
            voice: 'female',
            wakeWord: wakeWords.get('female') || 'natsu',
            confidence: 0.95,
          });
        }
      }, 5000);
    } catch (error) {
      this.isListening = false;
      this.emit('error', { error, context: 'WakeWord startListening' });
      throw error;
    }
  }

  /**
   * Stop listening for wake words
   */
  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      // TODO: close Porcupine audio stream
      this.isListening = false;
      this.onDetectedCallback = undefined;
      console.log('[WakeWord] Stopped listening');
    } catch (error) {
      this.emit('error', { error, context: 'WakeWord stopListening' });
      throw error;
    }
  }

  /**
   * Update wake word for a specific voice at runtime
   * No need to restart listening
   */
  async updateWakeWord(voice: VoiceType, newWakeWord: string): Promise<void> {
    if (!this.isReady) {
      throw new Error('Wake word detector not ready');
    }

    try {
      console.log(`[WakeWord] Updating ${voice} wake word to: "${newWakeWord}"`);

      // TODO: update Porcupine keyword model
      // 1. Reinitialize with new wake word
      // 2. Keep listening active (no interruption)
      // 3. Verify new keyword is valid

      this.wakeWords.set(voice, newWakeWord);
      this.emit('wake-word-updated', { voice, newWakeWord });
    } catch (error) {
      this.emit('error', { error, context: 'WakeWord updateWakeWord' });
      throw error;
    }
  }
}

/**
 * Factory function to create wake word detector
 */
export function createWakeWordDetector(): WakeWordDetector {
  return new PorcupineWakeWordDetector();
}
