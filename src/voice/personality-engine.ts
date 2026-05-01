/// <reference types="node" />

/**
 * Dynamic Personality Engine for NATSU
 * 
 * Creates, modifies, and deletes personalities at runtime
 * NO hardcoded personalities
 * All stored in Supabase as JSON
 * Unlimited personality expansion
 */

import { EventEmitter } from 'events';
import {
  DynamicPersonality,
  EmotionType,
  StyleType,
  PersonalityCreationRequest,
  PersonalityModificationRequest,
} from '../types-new';

/**
 * PersonalityEngine: Dynamic personality creator and manager
 * Enables unlimited personality generation and customization
 */
export class PersonalityEngine extends EventEmitter {
  private personalities: Map<string, DynamicPersonality> = new Map();

  constructor() {
    super();
  }

  /**
   * Create a new personality
   * Supports natural language parameter extraction or explicit params
   */
  async createPersonality(request: PersonalityCreationRequest): Promise<DynamicPersonality> {
    try {
      const { name, basePersonality, pitch, speed, volume, tone, emotion, style, description } = request;

      // Check if personality already exists
      if (this.personalities.has(name)) {
        throw new Error(`Personality "${name}" already exists`);
      }

      let newPersonality: DynamicPersonality;

      if (basePersonality && this.personalities.has(basePersonality)) {
        // Derive from existing personality
        const base = this.personalities.get(basePersonality)!;
        newPersonality = {
          ...base,
          name,
          description: description || base.description,
          pitch: pitch ?? base.pitch,
          speed: speed ?? base.speed,
          volume: volume ?? base.volume,
          tone: tone ?? base.tone,
          emotion: emotion ?? base.emotion,
          style: style ?? base.style,
          createdAt: Date.now(),
          lastUsed: undefined,
          usageCount: 0,
          parentPersonality: basePersonality,
        };
      } else {
        // Create new from scratch with smart defaults
        newPersonality = {
          name,
          description: description || `${emotion} ${style} personality`,
          createdAt: Date.now(),
          usageCount: 0,
          pitch: pitch ?? this.getDefaultPitch(emotion),
          speed: speed ?? this.getDefaultSpeed(style),
          volume: volume ?? 1.0,
          tone: tone || `${emotion}_${style}`,
          emotion: emotion || 'neutral',
          style: style || 'casual',
        };
      }

      // Save to map
      this.personalities.set(name, newPersonality);

      console.log('[PersonalityEngine] Created personality:', name, {
        emotion: newPersonality.emotion,
        style: newPersonality.style,
        pitch: newPersonality.pitch,
        speed: newPersonality.speed,
      });

      this.emit('personality-created', { personality: newPersonality });
      return newPersonality;
    } catch (error) {
      console.error('[PersonalityEngine] Creation failed:', error);
      this.emit('error', { error, context: 'createPersonality' });
      throw error;
    }
  }

  /**
   * Modify an existing personality
   */
  async modifyPersonality(request: PersonalityModificationRequest): Promise<DynamicPersonality> {
    try {
      const { name, changes } = request;

      if (!this.personalities.has(name)) {
        throw new Error(`Personality "${name}" not found`);
      }

      const existing = this.personalities.get(name)!;
      const updated: DynamicPersonality = {
        ...existing,
        ...changes,
        name, // cannot change name
        createdAt: existing.createdAt, // cannot change creation time
      };

      this.personalities.set(name, updated);

      console.log('[PersonalityEngine] Modified personality:', name, changes);

      this.emit('personality-modified', { personality: updated });
      return updated;
    } catch (error) {
      console.error('[PersonalityEngine] Modification failed:', error);
      this.emit('error', { error, context: 'modifyPersonality' });
      throw error;
    }
  }

  /**
   * Delete a personality
   */
  async deletePersonality(name: string): Promise<void> {
    try {
      if (!this.personalities.has(name)) {
        throw new Error(`Personality "${name}" not found`);
      }

      this.personalities.delete(name);

      console.log('[PersonalityEngine] Deleted personality:', name);

      this.emit('personality-deleted', { name });
    } catch (error) {
      console.error('[PersonalityEngine] Deletion failed:', error);
      this.emit('error', { error, context: 'deletePersonality' });
      throw error;
    }
  }

  /**
   * Get a personality by name
   */
  getPersonality(name: string): DynamicPersonality | undefined {
    return this.personalities.get(name);
  }

  /**
   * Get all personalities
   */
  getAllPersonalities(): DynamicPersonality[] {
    return Array.from(this.personalities.values());
  }

  /**
   * Load personalities from config (from Supabase)
   */
  loadPersonalities(personalities: Record<string, DynamicPersonality>): void {
    this.personalities.clear();
    Object.entries(personalities).forEach(([name, personality]) => {
      this.personalities.set(name, personality);
    });
    console.log('[PersonalityEngine] Loaded', this.personalities.size, 'personalities');
  }

  /**
   * Export personalities for saving (to Supabase)
   */
  exportPersonalities(): Record<string, DynamicPersonality> {
    const result: Record<string, DynamicPersonality> = {};
    this.personalities.forEach((personality, name) => {
      result[name] = personality;
    });
    return result;
  }

  /**
   * Get default pitch based on emotion
   * Smarter defaults than hardcoded personalities
   */
  private getDefaultPitch(emotion?: EmotionType): number {
    const pitchMap: Record<EmotionType, number> = {
      happy: 1.3,
      sad: 0.85,
      angry: 1.1,
      neutral: 1.0,
      excited: 1.4,
      teasing: 1.25,
      flirty: 1.3,
      calm: 0.9,
      playful: 1.2,
    };
    return pitchMap[emotion || 'neutral'];
  }

  /**
   * Get default speed based on style
   */
  private getDefaultSpeed(style?: StyleType): number {
    const speedMap: Record<StyleType, number> = {
      casual: 1.0,
      formal: 0.9,
      playful: 1.2,
      serious: 0.85,
      sarcastic: 1.15,
      sweet: 0.95,
      energetic: 1.3,
    };
    return speedMap[style || 'casual'];
  }

  /**
   * Create personality from natural language description
   * Smart inference from user input like: "Create a flirty personality"
   */
  async createFromDescription(description: string): Promise<DynamicPersonality> {
    // Extract personality name (first word typically)
    const words = description.toLowerCase().split(/\s+/);
    const nameMatch = description.match(/[a-zA-Z]+/);
    const name = nameMatch ? nameMatch[0] : 'custom';

    // Infer emotion and style from description
    const emotion = this.inferEmotion(description);
    const style = this.inferStyle(description);

    return this.createPersonality({
      name,
      emotion,
      style,
      description,
    });
  }

  /**
   * Infer emotion from text
   */
  private inferEmotion(text: string): EmotionType {
    const lower = text.toLowerCase();

    if (lower.includes('teasing') || lower.includes('tease')) return 'teasing';
    if (lower.includes('flirt')) return 'flirty';
    if (lower.includes('excited') || lower.includes('excitement')) return 'excited';
    if (lower.includes('happy') || lower.includes('cheerful')) return 'happy';
    if (lower.includes('sad') || lower.includes('melancholy')) return 'sad';
    if (lower.includes('angry') || lower.includes('aggressive')) return 'angry';
    if (lower.includes('calm') || lower.includes('peaceful')) return 'calm';
    if (lower.includes('playful') || lower.includes('fun')) return 'playful';

    return 'neutral';
  }

  /**
   * Infer style from text
   */
  private inferStyle(text: string): StyleType {
    const lower = text.toLowerCase();

    if (lower.includes('casual')) return 'casual';
    if (lower.includes('formal') || lower.includes('professional')) return 'formal';
    if (lower.includes('playful')) return 'playful';
    if (lower.includes('serious')) return 'serious';
    if (lower.includes('sarcastic') || lower.includes('sarcasm')) return 'sarcastic';
    if (lower.includes('sweet')) return 'sweet';
    if (lower.includes('energetic') || lower.includes('energy')) return 'energetic';

    return 'casual';
  }
}

/**
 * Factory function
 */
export function createPersonalityEngine(): PersonalityEngine {
  return new PersonalityEngine();
}
