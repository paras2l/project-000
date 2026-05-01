/**
 * NATSU Voice UI Component
 * React component for web, mobile, and desktop
 * 
 * Features:
 * - Voice command recognition
 * - Real-time personality adjustments
 * - Personality saving/loading
 * - Cross-platform (Web/iOS/Android/Desktop)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  VoicePersonality,
  parseVoiceCommand,
  applyPersonalityToSpeech,
  clampPersonality,
  createDefaultPersonality,
  createCustomPersonality,
} from '../shared/voice-personality';

const NatsuVoiceApp: React.FC = () => {
  const [personality, setPersonality] = useState<VoicePersonality>(createDefaultPersonality());
  const [savedPersonalities, setSavedPersonalities] = useState<VoicePersonality[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const synth = window.speechSynthesis;

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (event: any) => {
        setFeedback(`Error: ${event.error}`);
      };

      recognitionRef.current.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setTranscript(text);
        handleVoiceCommand(text);
      };
    }
  }, []);

  // Load saved personalities from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('natsu-personalities');
    if (saved) {
      setSavedPersonalities(JSON.parse(saved));
    }
  }, []);

  // Handle voice command
  const handleVoiceCommand = (text: string) => {
    const command = parseVoiceCommand(text);

    if (command.confidenceLevel < 0.5) {
      setFeedback('Command not recognized');
      return;
    }

    let newPersonality = { ...personality };

    switch (command.intent) {
      case 'adjust-pitch':
        if (command.value !== undefined) {
          newPersonality.pitch = command.value as number;
        } else if (command.delta) {
          newPersonality.pitch += command.delta;
        }
        setFeedback(`Pitch adjusted to ${(newPersonality.pitch * 100).toFixed(0)}%`);
        break;

      case 'adjust-speed':
        if (command.value !== undefined) {
          newPersonality.speed = command.value as number;
        } else if (command.delta) {
          newPersonality.speed += command.delta;
        }
        setFeedback(`Speed adjusted to ${(newPersonality.speed * 100).toFixed(0)}%`);
        break;

      case 'adjust-volume':
        if (command.delta) {
          newPersonality.volume += command.delta;
        }
        setFeedback(`Volume adjusted to ${(newPersonality.volume * 100).toFixed(0)}%`);
        break;

      case 'adjust-sweetness':
        if (command.delta) {
          newPersonality.sweetness += command.delta;
        }
        setFeedback(`Sweetness adjusted to ${(newPersonality.sweetness * 100).toFixed(0)}%`);
        break;

      case 'change-tone':
        newPersonality.tone = command.value as any;
        setFeedback(`Tone changed to ${command.value}`);
        break;

      case 'change-voice':
        newPersonality.voiceType = command.value as any;
        setFeedback(`Voice changed to ${command.value}`);
        break;

      case 'save-personality':
        const newSaved = createCustomPersonality(command.value as string, personality);
        setSavedPersonalities([...savedPersonalities, newSaved]);
        localStorage.setItem('natsu-personalities', JSON.stringify([...savedPersonalities, newSaved]));
        setFeedback(`Personality saved as "${command.value}"`);
        return;

      case 'load-personality':
        const found = savedPersonalities.find((p) => p.name.toLowerCase() === (command.value as string).toLowerCase());
        if (found) {
          newPersonality = found;
          setFeedback(`Switched to "${found.name}" personality`);
        } else {
          setFeedback(`Personality "${command.value}" not found`);
          return;
        }
        break;

      case 'list-personalities':
        const list = savedPersonalities.map((p) => p.name).join(', ') || 'No saved personalities';
        setFeedback(`Saved: ${list}`);
        return;

      default:
        setFeedback('Command not recognized');
        return;
    }

    newPersonality = clampPersonality(newPersonality);
    setPersonality(newPersonality);
  };

  // Speak with current personality
  const handleSpeak = () => {
    const text = transcript || 'Hello, I am Natsu, your voice AI assistant.';

    if (synth.speaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    applyPersonalityToSpeech(utterance, personality);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    synth.speak(utterance);
  };

  // Start listening for voice commands
  const handleListen = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎤 NATSU Voice AI</h1>

      {/* Personality Display */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Current Personality</h2>
        <div style={styles.grid}>
          <div>
            <label>Pitch: {(personality.pitch * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={personality.pitch}
              onChange={(e) => setPersonality(clampPersonality({ ...personality, pitch: parseFloat(e.target.value) }))}
              style={styles.slider}
            />
          </div>

          <div>
            <label>Speed: {(personality.speed * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={personality.speed}
              onChange={(e) => setPersonality(clampPersonality({ ...personality, speed: parseFloat(e.target.value) }))}
              style={styles.slider}
            />
          </div>

          <div>
            <label>Volume: {(personality.volume * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={personality.volume}
              onChange={(e) => setPersonality(clampPersonality({ ...personality, volume: parseFloat(e.target.value) }))}
              style={styles.slider}
            />
          </div>

          <div>
            <label>Sweetness: {(personality.sweetness * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={personality.sweetness}
              onChange={(e) => setPersonality(clampPersonality({ ...personality, sweetness: parseFloat(e.target.value) }))}
              style={styles.slider}
            />
          </div>

          <div>
            <label>Voice Type</label>
            <select
              value={personality.voiceType}
              onChange={(e) => setPersonality({ ...personality, voiceType: e.target.value as 'male' | 'female' })}
              style={styles.select}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>

          <div>
            <label>Tone</label>
            <select
              value={personality.tone}
              onChange={(e) => setPersonality({ ...personality, tone: e.target.value as any })}
              style={styles.select}
            >
              <option value="bright">Bright</option>
              <option value="neutral">Neutral</option>
              <option value="deep">Deep</option>
            </select>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Controls</h2>
        <div style={styles.buttonGroup}>
          <button onClick={handleListen} style={{ ...styles.button, backgroundColor: isListening ? '#ff6b6b' : '#007bff' }}>
            {isListening ? '🛑 Stop Listening' : '🎤 Start Listening'}
          </button>

          <button onClick={handleSpeak} style={{ ...styles.button, backgroundColor: isSpeaking ? '#ff6b6b' : '#28a745' }}>
            {isSpeaking ? '⏸️ Stop Speaking' : '🔊 Speak'}
          </button>
        </div>

        {feedback && <div style={styles.feedback}>{feedback}</div>}
        {transcript && <div style={styles.transcript}>You said: "{transcript}"</div>}
      </div>

      {/* Voice Commands Help */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Voice Commands</h2>
        <ul style={styles.list}>
          <li>"increase pitch 30%" / "slow down" / "louder"</li>
          <li>"make voice sweeter" / "use male voice"</li>
          <li>"use deep tone" / "use bright tone"</li>
          <li>"save this as [name]" / "switch to [name]"</li>
          <li>"show saved" / "list personalities"</li>
        </ul>
      </div>

      {/* Saved Personalities */}
      {savedPersonalities.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Saved Personalities ({savedPersonalities.length})</h2>
          <div style={styles.grid}>
            {savedPersonalities.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersonality(p)}
                style={{
                  ...styles.personalityButton,
                  backgroundColor: personality.id === p.id ? '#007bff' : '#e9ecef',
                  color: personality.id === p.id ? 'white' : 'black',
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
  },
  card: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '18px',
    color: '#333',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  slider: {
    width: '100%',
    marginTop: '5px',
  },
  select: {
    width: '100%',
    padding: '8px',
    marginTop: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: '150px',
    padding: '12px 20px',
    fontSize: '16px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  feedback: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#d1ecf1',
    border: '1px solid #bee5eb',
    borderRadius: '4px',
    color: '#0c5460',
  },
  transcript: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#e7f3ff',
    border: '1px solid #b3d9ff',
    borderRadius: '4px',
    color: '#004085',
    fontStyle: 'italic',
  },
  list: {
    marginLeft: '20px',
    lineHeight: '1.8',
  },
  personalityButton: {
    padding: '10px 15px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
};

export default NatsuVoiceApp;
