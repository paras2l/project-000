/**
 * Voice Personality System - Cross-Platform
 * 
 * Personality = adjustable voice parameters (no presets)
 * Users control: pitch, speed, volume, tone, sweetness via voice commands
 * 
 * Works on: Web, iOS, Android, Desktop
 */

export interface VoicePersonality {
  id: string;
  name: string;
  pitch: number;        // 0.5 to 2.0 (low to high)
  speed: number;        // 0.5 to 2.0 (slow to fast)
  volume: number;       // 0 to 1 (quiet to loud)
  sweetness: number;    // 0 to 1 (robotic to smooth)
  tone: 'bright' | 'deep' | 'neutral';
  voiceType: 'male' | 'female';
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface VoiceCommand {
  intent: 'adjust-pitch' | 'adjust-speed' | 'adjust-volume' | 'adjust-sweetness' | 'change-tone' | 'change-voice' | 'save-personality' | 'load-personality' | 'list-personalities' | 'unknown';
  value?: number | string;
  delta?: number;
  confidenceLevel: number;
}

/**
 * Parse natural language voice commands
 */
export function parseVoiceCommand(text: string): VoiceCommand {
  const lower = text.toLowerCase().trim();

  // Pitch adjustments: "increase pitch", "make voice higher", "pitch 150%"
  if (lower.match(/(?:increase|raise|higher).*pitch|pitch.*(?:up|higher|increase)/i)) {
    return {
      intent: 'adjust-pitch',
      delta: 0.1,
      confidenceLevel: 0.95,
    };
  }
  if (lower.match(/(?:decrease|lower|reduce).*pitch|pitch.*(?:down|lower|decrease)/i)) {
    return {
      intent: 'adjust-pitch',
      delta: -0.1,
      confidenceLevel: 0.95,
    };
  }
  const pitchPercent = lower.match(/pitch\s+(?:to\s+)?(\d+)%?/i);
  if (pitchPercent) {
    return {
      intent: 'adjust-pitch',
      value: parseInt(pitchPercent[1]) / 100,
      confidenceLevel: 0.95,
    };
  }

  // Speed adjustments: "slow down", "speak faster", "speed 75%"
  if (lower.match(/slow(?:\s+down)?|(?:make|speak).*slower|reduce.*speed|speed.*(?:down|lower)/i)) {
    return {
      intent: 'adjust-speed',
      delta: -0.1,
      confidenceLevel: 0.95,
    };
  }
  if (lower.match(/(?:speed\s+)?up|(?:make|speak).*faster|increase.*speed|speed.*(?:up|higher)/i)) {
    return {
      intent: 'adjust-speed',
      delta: 0.1,
      confidenceLevel: 0.95,
    };
  }

  // Volume adjustments: "louder", "quieter", "volume 80%"
  if (lower.match(/(?:make|turn|speak).*(?:loud|louder)|volume.*(?:up|increase)|increase.*volume/i)) {
    return {
      intent: 'adjust-volume',
      delta: 0.1,
      confidenceLevel: 0.95,
    };
  }
  if (lower.match(/(?:make|turn|speak).*(?:quiet|quieter|soft)|volume.*(?:down|decrease)|decrease.*volume/i)) {
    return {
      intent: 'adjust-volume',
      delta: -0.1,
      confidenceLevel: 0.95,
    };
  }

  // Sweetness adjustments: "make voice sweeter", "more robotic"
  if (lower.match(/(?:make|make\s+voice).*(?:sweet|sweeter|smooth)|more.*smooth|less.*robotic/i)) {
    return {
      intent: 'adjust-sweetness',
      delta: 0.1,
      confidenceLevel: 0.9,
    };
  }
  if (lower.match(/(?:make|make\s+voice).*(?:robot|robotic)|less.*sweet|more.*robotic/i)) {
    return {
      intent: 'adjust-sweetness',
      delta: -0.1,
      confidenceLevel: 0.9,
    };
  }

  // Tone changes: "use bright tone", "make voice deep"
  if (lower.match(/(?:bright|crisp|clear).*tone|use.*bright|make.*voice.*bright/i)) {
    return {
      intent: 'change-tone',
      value: 'bright',
      confidenceLevel: 0.9,
    };
  }
  if (lower.match(/(?:deep|warm|dark).*tone|use.*deep|make.*voice.*deep/i)) {
    return {
      intent: 'change-tone',
      value: 'deep',
      confidenceLevel: 0.9,
    };
  }

  // Voice type changes: "use male voice", "switch to female"
  if (lower.match(/(?:male|man|boy)(?:\s+voice)?|use.*male|switch.*to.*male/i)) {
    return {
      intent: 'change-voice',
      value: 'male',
      confidenceLevel: 0.95,
    };
  }
  if (lower.match(/(?:female|woman|girl)(?:\s+voice)?|use.*female|switch.*to.*female/i)) {
    return {
      intent: 'change-voice',
      value: 'female',
      confidenceLevel: 0.95,
    };
  }

  // Save personality: "save this as [name]"
  const saveName = lower.match(/save\s+(?:this\s+)?(?:as\s+)?(?:my\s+)?([a-z_]+)/i);
  if (saveName) {
    return {
      intent: 'save-personality',
      value: saveName[1],
      confidenceLevel: 0.95,
    };
  }

  // Load personality: "switch to [name]", "use [name] voice"
  const loadName = lower.match(/(?:switch|load|change)\s+(?:to\s+)?([a-z_]+)|use\s+([a-z_]+)\s+(?:voice|personality)/i);
  if (loadName) {
    return {
      intent: 'load-personality',
      value: loadName[1] || loadName[2],
      confidenceLevel: 0.9,
    };
  }

  // List personalities: "show saved", "list personalities"
  if (lower.match(/(?:show|list|get).*(?:saved|personalities|presets)|what.*saved/i)) {
    return {
      intent: 'list-personalities',
      confidenceLevel: 0.9,
    };
  }

  return {
    intent: 'unknown',
    confidenceLevel: 0.0,
  };
}

/**
 * Apply personality parameters to Web Speech API
 */
export function applyPersonalityToSpeech(utterance: SpeechSynthesisUtterance, personality: VoicePersonality): void {
  utterance.pitch = personality.pitch;
  utterance.rate = personality.speed;
  utterance.volume = personality.volume;
  
  // Note: sweetness is platform-specific, may need custom audio processing
  // For now, we adjust pitch slightly for sweetness effect
  if (personality.sweetness > 0.7) {
    utterance.pitch *= 1.05; // Slightly higher pitch for sweetness
  }
}

/**
 * Clamp personality values to valid ranges
 */
export function clampPersonality(personality: VoicePersonality): VoicePersonality {
  return {
    ...personality,
    pitch: Math.max(0.5, Math.min(2.0, personality.pitch)),
    speed: Math.max(0.5, Math.min(2.0, personality.speed)),
    volume: Math.max(0, Math.min(1, personality.volume)),
    sweetness: Math.max(0, Math.min(1, personality.sweetness)),
  };
}

/**
 * Create default personality
 */
export function createDefaultPersonality(): VoicePersonality {
  return {
    id: 'default-' + Date.now(),
    name: 'Default',
    pitch: 1.0,
    speed: 1.0,
    volume: 0.8,
    sweetness: 0.5,
    tone: 'neutral',
    voiceType: 'female',
    description: 'Default neutral voice',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Create custom personality with adjustments
 */
export function createCustomPersonality(
  name: string,
  basePersonality: VoicePersonality = createDefaultPersonality(),
  adjustments: Partial<VoicePersonality> = {}
): VoicePersonality {
  return clampPersonality({
    ...basePersonality,
    id: name + '-' + Date.now(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...adjustments,
  });
}
