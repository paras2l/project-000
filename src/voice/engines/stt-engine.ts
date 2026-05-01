/// <reference types="node" />

/**
 * Speech-to-Text (STT) Engine for NATSU
 * Supports: Deepgram (cloud) and Whisper (local)
 * Handles: continuous listening, one-shot recognition, language support
 */

import { EventEmitter } from 'events';
import { STTEngine, STTOptions } from '../types';

/**
 * DeepgramSTT: Cloud-based STT with Deepgram API
 * Requires: DEEPGRAM_API_KEY environment variable
 */
export class DeepgramSTT extends EventEmitter implements STTEngine {
  private apiKey: string;
  private isReady = false;
  private isListening = false;
  private onResultCallback?: (text: string) => void;

  constructor() {
    super();
    this.apiKey = process.env.DEEPGRAM_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[STT] DEEPGRAM_API_KEY not set - STT will not work');
    }
  }

  async initialize(): Promise<void> {
    try {
      // Verify Deepgram API key
      if (!this.apiKey) {
        throw new Error('DEEPGRAM_API_KEY not set');
      }
      this.isReady = true;
      console.log('[STT] Deepgram initialized successfully');
    } catch (error) {
      this.emit('error', { error, context: 'STT initialization' });
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.isListening) {
      await this.stopContinuous();
    }
    this.isReady = false;
  }

  isReady_(): boolean {
    return this.isReady;
  }

  /**
   * One-shot speech recognition
   * Sends audio buffer to Deepgram and returns transcript
   */
  async recognize(options?: STTOptions): Promise<string> {
    if (!this.isReady) {
      throw new Error('STT engine not ready');
    }

    try {
      // TODO: implement actual Deepgram API call
      // For now: return stub
      console.log('[STT] Recognizing speech with options:', options);

      // Stub implementation - in production:
      // 1. Capture audio from microphone
      // 2. Send to Deepgram API
      // 3. Parse response and return transcript

      return 'recognized speech would go here';
    } catch (error) {
      this.emit('error', { error, context: 'STT recognition' });
      throw error;
    }
  }

  /**
   * Continuous speech recognition (always listening)
   * Streams audio to Deepgram and emits results
   */
  async startContinuous(onResult: (text: string) => void): Promise<void> {
    if (!this.isReady) {
      throw new Error('STT engine not ready');
    }

    this.isListening = true;
    this.onResultCallback = onResult;

    try {
      // TODO: implement continuous Deepgram streaming
      // 1. Open WebSocket to Deepgram
      // 2. Stream audio chunks
      // 3. Emit results via callback
      console.log('[STT] Continuous listening started');
    } catch (error) {
      this.isListening = false;
      this.emit('error', { error, context: 'STT continuous start' });
      throw error;
    }
  }

  async stopContinuous(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      // TODO: close Deepgram WebSocket
      this.isListening = false;
      this.onResultCallback = undefined;
      console.log('[STT] Continuous listening stopped');
    } catch (error) {
      this.emit('error', { error, context: 'STT continuous stop' });
      throw error;
    }
  }
}

/**
 * WhisperSTT: Local STT using OpenAI Whisper
 * Requires: whisper Python package installed
 * Lower latency, no API calls, works offline
 */
export class WhisperSTT extends EventEmitter implements STTEngine {
  private isReady = false;
  private isListening = false;
  private model: 'base' | 'small' | 'medium' | 'large' = 'base';
  private onResultCallback?: (text: string) => void;

  constructor(model: 'base' | 'small' | 'medium' | 'large' = 'base') {
    super();
    this.model = model;
  }

  async initialize(): Promise<void> {
    try {
      // TODO: check if whisper is installed
      // TODO: load whisper model
      this.isReady = true;
      console.log(`[STT] Whisper (${this.model}) initialized successfully`);
    } catch (error) {
      this.emit('error', { error, context: 'Whisper STT initialization' });
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.isListening) {
      await this.stopContinuous();
    }
    this.isReady = false;
  }

  isReady_(): boolean {
    return this.isReady;
  }

  async recognize(options?: STTOptions): Promise<string> {
    if (!this.isReady) {
      throw new Error('Whisper STT engine not ready');
    }

    try {
      // TODO: implement Whisper recognition
      // 1. Record audio from microphone
      // 2. Call whisper.transcribe()
      // 3. Return transcript
      console.log('[STT] Whisper recognizing with options:', options);
      return 'whisper recognition result';
    } catch (error) {
      this.emit('error', { error, context: 'Whisper recognition' });
      throw error;
    }
  }

  async startContinuous(onResult: (text: string) => void): Promise<void> {
    if (!this.isReady) {
      throw new Error('Whisper STT engine not ready');
    }

    this.isListening = true;
    this.onResultCallback = onResult;

    try {
      // TODO: implement continuous Whisper listening
      // 1. Start recording audio stream
      // 2. Buffer audio in chunks
      // 3. Send chunks to Whisper
      // 4. Emit results via callback
      console.log('[STT] Whisper continuous listening started');
    } catch (error) {
      this.isListening = false;
      this.emit('error', { error, context: 'Whisper continuous start' });
      throw error;
    }
  }

  async stopContinuous(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      // TODO: stop recording and close Whisper stream
      this.isListening = false;
      this.onResultCallback = undefined;
      console.log('[STT] Whisper continuous listening stopped');
    } catch (error) {
      this.emit('error', { error, context: 'Whisper continuous stop' });
      throw error;
    }
  }
}

/**
 * Factory function to get appropriate STT engine
 */
export function createSTTEngine(provider: 'deepgram' | 'whisper' = 'whisper'): STTEngine {
  if (provider === 'deepgram') {
    return new DeepgramSTT();
  }
  return new WhisperSTT('base');
}
