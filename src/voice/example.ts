/**
 * Voice System Quick-Start Example
 * Shows basic setup and usage of NATSU voice system
 */

import { createVoiceManager } from './index';

async function main() {
  try {
    // 1. Create voice manager for current user
    const voiceManager = createVoiceManager('user-123');

    // 2. Initialize (loads config from Supabase, sets up engines)
    console.log('Initializing voice system...');
    await voiceManager.initialize();

    // 3. Set up event listeners
    voiceManager.on('wake-word-detected', (event) => {
      console.log(`\n🎤 ${event.voice} voice detected: "${event.wakeWord}"`);
    });

    voiceManager.on('speech-recognized', (event) => {
      console.log(`📝 Recognized: "${event.text}"`);
    });

    voiceManager.on('personality-changed', (event) => {
      console.log(`😊 Personality changed to: ${event.newPersonality}`);
    });

    voiceManager.on('voice-switched', (event) => {
      console.log(`🔊 Switched to ${event.newVoice} voice`);
    });

    voiceManager.on('error', (event) => {
      console.error(`❌ Error in ${event.context}:`, event.error.message);
    });

    // 4. Start listening for wake words (always-on mode)
    console.log('Starting voice listener...');
    console.log('Say "Natsu" to wake me up\n');
    await voiceManager.startListening();

    // 5. Example: Speak with current personality
    setTimeout(async () => {
      await voiceManager.speak("Hi! I'm Natsu, your AI bestie!");
    }, 2000);

    // 6. Example: Handle voice commands
    // In real app, these come from STT recognition
    // Simulate command processing after 5 seconds
    setTimeout(async () => {
      console.log('\n→ Simulating voice command...');
      await voiceManager.handleCommand('Be more professional');
    }, 5000);

    // 7. Example: Direct method calls
    setTimeout(async () => {
      const config = voiceManager.getConfig();
      console.log('\n📋 Current config:');
      console.log('  - Voice:', config.currentVoice);
      console.log('  - Personality:', config.personality);
      console.log('  - Volume:', config.volume);
      console.log('  - Pitch:', config.pitch);
      console.log('  - Speed:', config.speed);
    }, 7000);

    // 8. Keep listening
    process.on('SIGINT', async () => {
      console.log('\n\nShutting down...');
      await voiceManager.cleanup();
      process.exit(0);
    });
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run example
main();

/**
 * USAGE EXAMPLES:
 *
 * Voice Commands (spoken to microphone):
 *   - "Change wake word to hey bestie"
 *   - "Switch to male voice"
 *   - "Be more energetic"
 *   - "Turn up volume"
 *   - "Slow down"
 *   - "Increase pitch"
 *
 * Programmatic:
 *   - voiceManager.speak("Hello world")
 *   - voiceManager.switchVoice('male')
 *   - voiceManager.setPersonality('cute')
 *   - voiceManager.handleCommand("Be professional")
 */
