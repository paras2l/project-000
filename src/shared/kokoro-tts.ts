/**
 * Kokoro TTS Engine
 * 
 * Unlimited voice generation by parameters
 * Inspired by N.E.K.O streaming architecture
 * 
 * Generate voices like:
 * - "25 year old British female with mysterious tone"
 * - "70 year old raspy male with wise emotion"
 * - "18 year old cheerful female with energetic speed"
 */

import { EventEmitter } from 'events';
import { NatsuConfig } from './natsu-config';

export interface VoiceParameters {
  gender: 'male' | 'female' | 'neutral';
  age: number; // 18-80
  emotion: 'happy' | 'sad' | 'neutral' | 'angry' | 'excited' | 'mysterious' | 'wise';
  accent: 'american' | 'british' | 'french' | 'indian' | 'russian' | 'neutral';
  speed: number; // 0.5-2.0
  pitch: number; // 0.5-2.0
  volume: number; // 0-1
  roughness?: number; // 0-1 (for raspy quality)
  brightness?: number; // 0-1 (for voice brightness)
}

export interface SpeechSynthesisOptions {
  text: string;
  voiceParams: VoiceParameters;
  streamCallback?: (chunk: ArrayBuffer) => void; // For streaming
}

export interface GeneratedVoice {
  id: string;
  name: string;
  params: VoiceParameters;
  createdAt: number;
  sampleRate: number; // 16000, 24000, 44100
  duration: number; // milliseconds
}

/**
 * KokoroTTS: Unlimited voice generation engine
 * Each voice is fully customizable, not limited to presets
 */
export class KokoroTTS extends EventEmitter {
  private config: NatsuConfig;
  private isReady = false;
  private audioContext: AudioContext | null = null;
  private savedVoices: Map<string, GeneratedVoice> = new Map();
  private currentSpeech: { id: string; abort: AbortController } | null = null;

  constructor(config: NatsuConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize Kokoro engine
   */
  async initialize(): Promise<void> {
    try {
      console.log('[Kokoro] Initializing TTS engine...');

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // TODO: Load Kokoro model
      // const model = await fetch(this.config.modelSources.voiceModels);
      // await this.loadKokoroModel(model);

      this.isReady = true;
      console.log('[Kokoro] TTS engine ready');
      this.emit('ready');
    } catch (error) {
      this.emit('error', { error, context: 'Kokoro initialization' });
      throw error;
    }
  }

  /**
   * Generate and speak text with custom voice parameters
   * Supports interruption (N.E.K.O style)
   */
  async speak(options: SpeechSynthesisOptions): Promise<void> {
    if (!this.isReady) {
      throw new Error('Kokoro TTS not ready');
    }

    // Cancel previous speech if streaming
    if (this.currentSpeech) {
      await this.stopSpeaking();
    }

    const speechId = 'speech-' + Date.now();
    const abortController = new AbortController();
    this.currentSpeech = { id: speechId, abort: abortController };

    try {
      const { text, voiceParams, streamCallback } = options;

      console.log('[Kokoro] Speaking:', {
        text: text.substring(0, 50) + '...',
        gender: voiceParams.gender,
        age: voiceParams.age,
        emotion: voiceParams.emotion,
        accent: voiceParams.accent,
      });

      this.emit('speech-started', { speechId });

      // TODO: Real Kokoro synthesis
      // 1. Send voice params + text to Kokoro model
      // 2. Get audio buffer (streaming chunks)
      // 3. Play audio through AudioContext

      // Stub: Simulate with Web Speech API
      await this.speakWithWebSpeechAPI(text, voiceParams);

      if (this.currentSpeech?.id === speechId) {
        this.emit('speech-ended', { speechId });
        this.currentSpeech = null;
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'aborted') {
        console.log('[Kokoro] Speech interrupted');
        return;
      }
      this.emit('error', { error, context: 'Kokoro speak' });
      throw error;
    }
  }

  /**
   * Stop current speech (with interruption handling)
   */
  async stopSpeaking(): Promise<void> {
    if (this.currentSpeech) {
      this.currentSpeech.abort.abort();
      this.currentSpeech = null;
      console.log('[Kokoro] Speech stopped');
      this.emit('speech-stopped');
    }
  }

  /**
   * Generate voice and save for future use
   */
  async generateVoice(name: string, params: VoiceParameters): Promise<GeneratedVoice> {
    try {
      const generatedVoice: GeneratedVoice = {
        id: 'voice-' + Date.now(),
        name,
        params,
        createdAt: Date.now(),
        sampleRate: 24000,
        duration: 0, // Calculated during generation
      };

      this.savedVoices.set(name, generatedVoice);
      console.log('[Kokoro] Generated voice:', name, params);
      this.emit('voice-generated', generatedVoice);

      return generatedVoice;
    } catch (error) {
      this.emit('error', { error, context: 'generateVoice' });
      throw error;
    }
  }

  /**
   * Get saved voice by name
   */
  getVoice(name: string): GeneratedVoice | undefined {
    return this.savedVoices.get(name);
  }

  /**
   * List all saved voices
   */
  listVoices(): GeneratedVoice[] {
    return Array.from(this.savedVoices.values());
  }

  /**
   * Delete saved voice
   */
  deleteVoice(name: string): void {
    this.savedVoices.delete(name);
    console.log('[Kokoro] Deleted voice:', name);
    this.emit('voice-deleted', { name });
  }

  /**
   * Export voice parameters as JSON (for sharing)
   */
  exportVoice(name: string): string {
    const voice = this.savedVoices.get(name);
    if (!voice) {
      throw new Error(`Voice "${name}" not found`);
    }
    return JSON.stringify(voice, null, 2);
  }

  /**
   * Import voice from JSON
   */
  async importVoice(jsonString: string, newName?: string): Promise<GeneratedVoice> {
    try {
      const imported = JSON.parse(jsonString) as GeneratedVoice;
      const name = newName || imported.name;
      this.savedVoices.set(name, { ...imported, name });
      console.log('[Kokoro] Imported voice:', name);
      return this.savedVoices.get(name)!;
    } catch (error) {
      this.emit('error', { error, context: 'importVoice' });
      throw error;
    }
  }

  /**
   * Create default voice parameters
   */
  getDefaultVoiceParams(): VoiceParameters {
    return {
      gender: this.config.voice.defaultGender,
      age: this.config.voice.defaultAge,
      emotion: this.config.voice.defaultEmotion,
      accent: this.config.voice.defaultAccent,
      speed: this.config.voice.speed,
      pitch: this.config.voice.pitch,
      volume: this.config.voice.volume,
      roughness: 0,
      brightness: 0.5,
    };
  }

  /**
   * Stub: Use Web Speech API for now (until Kokoro integration)
   */
  private async speakWithWebSpeechAPI(text: string, params: VoiceParameters): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.pitch = params.pitch;
      utterance.rate = params.speed;
      utterance.volume = params.volume;

      // Select voice based on gender
      const voices = speechSynthesis.getVoices();
      if (params.gender === 'male') {
        utterance.voice = voices.find((v) => v.name.includes('Google UK')) || voices[0];
      } else {
        utterance.voice = voices.find((v) => v.name.includes('Google US')) || voices[0];
      }

      utterance.onend = resolve;
      utterance.onerror = () => resolve();

      speechSynthesis.speak(utterance);
    });
  }

  isReady_(): boolean {
    return this.isReady;
  }
}

export function createKokoroTTS(config: NatsuConfig): KokoroTTS {
  return new KokoroTTS(config);
}
