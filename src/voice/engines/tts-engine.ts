/// <reference types="node" />

/**
 * Text-to-Speech (TTS) Engine for NATSU
 * Supports: ElevenLabs (quality) and OpenAI (flexibility)
 * Features: personality-driven voice adjustments, dual voice (female/male)
 */

import { EventEmitter } from 'events';
import { TTSEngine, TTSOptions, VoiceType, PersonalityType } from '../types';
import { applyPersonalityToSettings, VOICE_MODELS } from '../personalities';

/**
 * ElevenLabsTTS: High-quality voice synthesis with ElevenLabs
 * Requires: ELEVENLABS_API_KEY environment variable
 */
export class ElevenLabsTTS extends EventEmitter implements TTSEngine {
  private apiKey: string;
  private isReady = false;
  private voiceIdMap: Record<VoiceType, string> = {
    female: 'VR6AewLBtn7XN0v7ChO9', // Rachel (anime-style, cute)
    male: 'nPczCjzI2devNBz1zQrH', // Callum (male voice)
  };

  constructor() {
    super();
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[TTS] ELEVENLABS_API_KEY not set - TTS will not work');
    }
  }

  async initialize(): Promise<void> {
    try {
      if (!this.apiKey) {
        throw new Error('ELEVENLABS_API_KEY not set');
      }
      this.isReady = true;
      console.log('[TTS] ElevenLabs initialized successfully');
    } catch (error) {
      this.emit('error', { error, context: 'ElevenLabs initialization' });
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    this.isReady = false;
  }

  isReady_(): boolean {
    return this.isReady;
  }

  /**
   * Speak text using ElevenLabs with personality adjustments
   */
  async speak(options: TTSOptions): Promise<void> {
    if (!this.isReady) {
      throw new Error('TTS engine not ready');
    }

    try {
      const voiceId = this.voiceIdMap[options.voice];
      const adjustedSettings = applyPersonalityToSettings(
        {
          pitch: options.pitch ?? 1.0,
          rate: options.speed ?? 1.0,
          volume: options.volume ?? 1.0,
        },
        options.personality
      );

      console.log('[TTS] Speaking with ElevenLabs:', {
        text: options.text.substring(0, 50) + '...',
        voice: options.voice,
        personality: options.personality,
        adjustedSettings,
      });

      // TODO: implement actual ElevenLabs API call
      // 1. Call ElevenLabs API with voiceId
      // 2. Apply personality pitch/rate adjustments
      // 3. Play audio through speakers

      // Stub: simulate speaking
      this.emit('speech-started');
      setTimeout(() => {
        this.emit('speech-ended');
      }, Math.max(500, options.text.length * 20));
    } catch (error) {
      this.emit('error', { error, context: 'ElevenLabs speak' });
      throw error;
    }
  }

  /**
   * Synthesize text to audio buffer (for saving/streaming)
   */
  async synthesize(options: TTSOptions): Promise<Buffer> {
    if (!this.isReady) {
      throw new Error('TTS engine not ready');
    }

    try {
      const voiceId = this.voiceIdMap[options.voice];
      console.log('[TTS] Synthesizing with ElevenLabs:', voiceId, options.personality);

      // TODO: implement ElevenLabs synthesis and return audio buffer
      return Buffer.alloc(0); // stub
    } catch (error) {
      this.emit('error', { error, context: 'ElevenLabs synthesize' });
      throw error;
    }
  }

  /**
   * Stop current speech playback
   */
  async stop(): Promise<void> {
    try {
      console.log('[TTS] ElevenLabs speech stopped');
      this.emit('speech-stopped');
    } catch (error) {
      this.emit('error', { error, context: 'ElevenLabs stop' });
      throw error;
    }
  }
}

/**
 * OpenAITTS: Flexible TTS with OpenAI API
 * Requires: OPENAI_API_KEY environment variable
 * Supports: nova (female), onyx (male), echo (male variant)
 */
export class OpenAITTS extends EventEmitter implements TTSEngine {
  private apiKey: string;
  private isReady = false;
  private voiceMap: Record<VoiceType, 'nova' | 'onyx' | 'echo'> = {
    female: 'nova',
    male: 'onyx',
  };

  constructor() {
    super();
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[TTS] OPENAI_API_KEY not set - TTS will not work');
    }
  }

  async initialize(): Promise<void> {
    try {
      if (!this.apiKey) {
        throw new Error('OPENAI_API_KEY not set');
      }
      this.isReady = true;
      console.log('[TTS] OpenAI TTS initialized successfully');
    } catch (error) {
      this.emit('error', { error, context: 'OpenAI TTS initialization' });
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    this.isReady = false;
  }

  isReady_(): boolean {
    return this.isReady;
  }

  /**
   * Speak text using OpenAI with personality adjustments
   */
  async speak(options: TTSOptions): Promise<void> {
    if (!this.isReady) {
      throw new Error('TTS engine not ready');
    }

    try {
      const voiceModel = this.voiceMap[options.voice];
      const adjustedSettings = applyPersonalityToSettings(
        {
          pitch: options.pitch ?? 1.0,
          rate: options.speed ?? 1.0,
          volume: options.volume ?? 1.0,
        },
        options.personality
      );

      console.log('[TTS] Speaking with OpenAI:', {
        text: options.text.substring(0, 50) + '...',
        voice: options.voice,
        voiceModel,
        personality: options.personality,
        adjustedSettings,
      });

      // TODO: implement actual OpenAI TTS API call
      // 1. Call OpenAI TTS endpoint with voice model
      // 2. Apply personality adjustments (handled via prompt/synthesis params)
      // 3. Stream audio to speakers

      this.emit('speech-started');
      setTimeout(() => {
        this.emit('speech-ended');
      }, Math.max(500, options.text.length * 20));
    } catch (error) {
      this.emit('error', { error, context: 'OpenAI TTS speak' });
      throw error;
    }
  }

  /**
   * Synthesize text to audio buffer
   */
  async synthesize(options: TTSOptions): Promise<Buffer> {
    if (!this.isReady) {
      throw new Error('TTS engine not ready');
    }

    try {
      const voiceModel = this.voiceMap[options.voice];
      console.log('[TTS] Synthesizing with OpenAI:', voiceModel);

      // TODO: implement OpenAI synthesis and return audio buffer
      return Buffer.alloc(0); // stub
    } catch (error) {
      this.emit('error', { error, context: 'OpenAI synthesize' });
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      console.log('[TTS] OpenAI TTS speech stopped');
      this.emit('speech-stopped');
    } catch (error) {
      this.emit('error', { error, context: 'OpenAI stop' });
      throw error;
    }
  }
}

/**
 * Factory function to create TTS engine
 */
export function createTTSEngine(provider: 'elevenlabs' | 'openai' = 'openai'): TTSEngine {
  if (provider === 'elevenlabs') {
    return new ElevenLabsTTS();
  }
  return new OpenAITTS();
}
