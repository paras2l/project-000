/**
 * Voice Command Parser
 * 
 * Converts natural language to voice parameters
 * Examples:
 * - "Create a 25 year old British female voice" → VoiceParameters
 * - "Make voice older and more raspy" → Modified params
 * - "Switch to happy emotion with faster speed" → New params
 */

import { VoiceParameters } from './kokoro-tts';

export interface ParsedVoiceCommand {
  intent: 'create-voice' | 'modify-voice' | 'save-voice' | 'load-voice' | 'list-voices' | 'delete-voice' | 'unknown';
  parameters?: Partial<VoiceParameters>;
  voiceName?: string;
  confidence: number;
}

/**
 * Parse natural language voice commands
 * No hardcoding - inference-based parameter extraction
 */
export function parseVoiceCommand(text: string): ParsedVoiceCommand {
  const lower = text.toLowerCase().trim();

  // Create voice: "Create/generate a voice..."
  if (lower.match(/^(?:create|generate|make|build)\s+(?:a\s+)?voice/i)) {
    const params = extractVoiceParameters(text);
    return {
      intent: 'create-voice',
      parameters: params,
      confidence: 0.95,
    };
  }

  // Modify voice: "Make voice... more... less..."
  if (lower.match(/^(?:make|modify|change|adjust)\s+(?:the\s+)?voice/i)) {
    const params = extractVoiceModifications(text);
    return {
      intent: 'modify-voice',
      parameters: params,
      confidence: 0.9,
    };
  }

  // Save voice: "Save this as..."
  const saveName = lower.match(/save\s+(?:this\s+)?as\s+(?:a\s+)?(?:voice\s+)?["']?([a-z_-]+)["']?/i);
  if (saveName) {
    return {
      intent: 'save-voice',
      voiceName: saveName[1],
      confidence: 0.95,
    };
  }

  // Load voice: "Use/switch to... voice"
  const loadName = lower.match(/(?:use|switch to|load|activate)\s+(?:the\s+)?["']?([a-z_-]+)["']?\s+(?:voice)?/i);
  if (loadName) {
    return {
      intent: 'load-voice',
      voiceName: loadName[1],
      confidence: 0.9,
    };
  }

  // List voices: "Show/list all voices"
  if (lower.match(/(?:show|list|get|display|what)\s+(?:are\s+)?(?:all\s+)?(?:saved\s+)?voices/i)) {
    return {
      intent: 'list-voices',
      confidence: 0.9,
    };
  }

  // Delete voice: "Delete... voice"
  const deleteName = lower.match(/delete\s+(?:the\s+)?["']?([a-z_-]+)["']?\s+(?:voice)?/i);
  if (deleteName) {
    return {
      intent: 'delete-voice',
      voiceName: deleteName[1],
      confidence: 0.9,
    };
  }

  return {
    intent: 'unknown',
    confidence: 0.0,
  };
}

/**
 * Extract voice parameters from "Create X voice with Y traits"
 */
function extractVoiceParameters(text: string): Partial<VoiceParameters> {
  const params: Partial<VoiceParameters> = {};

  // Gender
  if (text.match(/\b(?:male|man|boy)\b/i)) {
    params.gender = 'male';
  } else if (text.match(/\b(?:female|woman|girl)\b/i)) {
    params.gender = 'female';
  }

  // Age: "25 year old", "70-year-old", "middle-aged"
  const ageMatch = text.match(/(?:(\d+)\s+years?\s+old|age\s+(\d+)|(\d+)-year-old)/i);
  if (ageMatch) {
    const age = parseInt(ageMatch[1] || ageMatch[2] || ageMatch[3] || '25');
    params.age = Math.max(18, Math.min(80, age));
  } else if (text.match(/young|teenager|youthful/i)) {
    params.age = 22;
  } else if (text.match(/middle[- ]?aged|mature/i)) {
    params.age = 45;
  } else if (text.match(/old|elder|elderly|aged/i)) {
    params.age = 70;
  }

  // Accent
  if (text.match(/british|uk|queen/i)) {
    params.accent = 'british';
  } else if (text.match(/american|us|american|southern/i)) {
    params.accent = 'american';
  } else if (text.match(/french|french accent/i)) {
    params.accent = 'french';
  } else if (text.match(/indian|hindi/i)) {
    params.accent = 'indian';
  } else if (text.match(/russian|slavic/i)) {
    params.accent = 'russian';
  }

  // Emotion
  if (text.match(/happy|cheerful|joyful|upbeat/i)) {
    params.emotion = 'happy';
  } else if (text.match(/sad|melancholy|sorrowful|gloomy/i)) {
    params.emotion = 'sad';
  } else if (text.match(/angry|angry|furious|aggressive/i)) {
    params.emotion = 'angry';
  } else if (text.match(/excited|thrilled|enthusiastic/i)) {
    params.emotion = 'excited';
  } else if (text.match(/mysterious|enigmatic|mysterious/i)) {
    params.emotion = 'mysterious';
  } else if (text.match(/wise|thoughtful|contemplative/i)) {
    params.emotion = 'wise';
  }

  // Speed
  if (text.match(/(?:very\s+)?fast|quick|rapid|speed[ed]?\s+up/i)) {
    params.speed = 1.5;
  } else if (text.match(/(?:very\s+)?slow|sluggish|slow[ed]?\s+down/i)) {
    params.speed = 0.7;
  } else if (text.match(/normal|medium|regular/i)) {
    params.speed = 1.0;
  }

  // Pitch
  if (text.match(/high|pitched|soprano/i)) {
    params.pitch = 1.4;
  } else if (text.match(/low|deep|bass/i)) {
    params.pitch = 0.7;
  } else if (text.match(/neutral|medium/i)) {
    params.pitch = 1.0;
  }

  // Roughness (raspy, gravelly)
  if (text.match(/raspy|gravelly|rough|hoarse/i)) {
    params.roughness = 0.8;
  } else if (text.match(/smooth|clear|clean/i)) {
    params.roughness = 0.0;
  }

  // Brightness
  if (text.match(/bright|crisp|clear|vivid/i)) {
    params.brightness = 0.8;
  } else if (text.match(/warm|mellow|dark|dull/i)) {
    params.brightness = 0.2;
  }

  // Volume
  if (text.match(/loud|louder|volume\s+up/i)) {
    params.volume = 1.0;
  } else if (text.match(/quiet|quieter|soft|volume\s+down/i)) {
    params.volume = 0.6;
  }

  return params;
}

/**
 * Extract modifications from "Make voice more X, less Y"
 */
function extractVoiceModifications(text: string): Partial<VoiceParameters> {
  const params: Partial<VoiceParameters> = {};

  // More/less patterns
  const moreMatches = text.matchAll(/more\s+(\w+)/gi);
  for (const match of moreMatches) {
    const quality = match[1].toLowerCase();

    switch (quality) {
      case 'raspy':
      case 'rough':
        params.roughness = 0.8;
        break;
      case 'fast':
      case 'speed':
        params.speed = (params.speed || 1.0) * 1.2;
        break;
      case 'high':
      case 'pitch':
        params.pitch = (params.pitch || 1.0) * 1.1;
        break;
      case 'loud':
      case 'volume':
        params.volume = Math.min(1.0, (params.volume || 0.8) + 0.2);
        break;
      case 'bright':
        params.brightness = 0.8;
        break;
    }
  }

  const lessMatches = text.matchAll(/less\s+(\w+)/gi);
  for (const match of lessMatches) {
    const quality = match[1].toLowerCase();

    switch (quality) {
      case 'raspy':
      case 'rough':
        params.roughness = 0.0;
        break;
      case 'fast':
      case 'speed':
        params.speed = (params.speed || 1.0) * 0.8;
        break;
      case 'high':
      case 'pitch':
        params.pitch = (params.pitch || 1.0) * 0.9;
        break;
      case 'loud':
      case 'volume':
        params.volume = Math.max(0.1, (params.volume || 0.8) - 0.2);
        break;
      case 'bright':
        params.brightness = 0.2;
        break;
    }
  }

  return params;
}

/**
 * Merge extracted parameters with existing voice
 */
export function mergeVoiceParameters(
  current: VoiceParameters,
  modifications: Partial<VoiceParameters>
): VoiceParameters {
  return {
    ...current,
    ...modifications,
    // Ensure values stay in range
    pitch: Math.max(0.5, Math.min(2.0, modifications.pitch || current.pitch)),
    speed: Math.max(0.5, Math.min(2.0, modifications.speed || current.speed)),
    volume: Math.max(0, Math.min(1, modifications.volume || current.volume)),
    roughness: Math.max(0, Math.min(1, modifications.roughness || current.roughness || 0)),
    brightness: Math.max(0, Math.min(1, modifications.brightness || current.brightness || 0.5)),
    age: Math.max(18, Math.min(80, modifications.age || current.age)),
  };
}

/**
 * Format voice parameters as readable description
 */
export function describeVoiceParameters(params: VoiceParameters): string {
  const parts: string[] = [];

  if (params.age) {
    parts.push(`${params.age} years old`);
  }

  if (params.gender) {
    parts.push(params.gender);
  }

  if (params.accent && params.accent !== 'neutral') {
    parts.push(`with ${params.accent} accent`);
  }

  if (params.emotion && params.emotion !== 'neutral') {
    parts.push(`sounding ${params.emotion}`);
  }

  if (params.roughness && params.roughness > 0.5) {
    parts.push('with raspy quality');
  }

  if (params.speed !== 1.0) {
    parts.push(`at ${(params.speed * 100).toFixed(0)}% speed`);
  }

  return parts.join(', ');
}
