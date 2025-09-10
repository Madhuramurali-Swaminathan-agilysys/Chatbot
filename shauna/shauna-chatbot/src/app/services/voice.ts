import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voiceName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private recognition: any;
  private synthesis: SpeechSynthesis;
  private isListening = new BehaviorSubject<boolean>(false);
  private transcriptionSubject = new Subject<string>();
  private errorSubject = new Subject<string>();
  
  public isListening$ = this.isListening.asObservable();
  public transcription$ = this.transcriptionSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  private defaultVoiceSettings: VoiceSettings = {
    rate: 0.9,          // Slightly slower for clarity
    pitch: 1.1,         // Slightly higher pitch for femininity
    volume: 1.0         // Maximum volume for loud playback
  };

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  /**
   * Initialize speech recognition
   */
  private initializeSpeechRecognition(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Improved settings for better recognition
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 3;
      
      // Remove grammars setting that's causing the error
      // this.recognition.grammars = null;

      this.recognition.onstart = () => {
        console.log('Speech recognition started');
        this.isListening.next(true);
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Send final transcript when available
        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          this.transcriptionSubject.next(finalTranscript.trim());
        }
        
        // Optionally emit interim results for real-time feedback
        if (interimTranscript && !finalTranscript) {
          console.log('Interim transcript:', interimTranscript);
          // You could emit interim results here if needed
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'Speech recognition error';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking louder or closer to the microphone.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone access denied or not available.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
            break;
          case 'network':
            errorMessage = 'Network error occurred during speech recognition.';
            break;
          case 'aborted':
            errorMessage = 'Speech recognition was aborted.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        this.errorSubject.next(errorMessage);
        this.isListening.next(false);
      };

      this.recognition.onend = () => {
        console.log('Speech recognition ended');
        this.isListening.next(false);
      };

      this.recognition.onnomatch = () => {
        console.log('No speech match found');
        this.errorSubject.next('Could not understand the speech. Please try again.');
      };
    }
  }

  /**
   * Check if speech recognition is supported
   */
  isSpeechRecognitionSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Check if speech synthesis is supported
   */
  isSpeechSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Start listening for voice input
   */
  startListening(): void {
    if (!this.isSpeechRecognitionSupported()) {
      this.errorSubject.next('Speech recognition is not supported in this browser');
      return;
    }

    if (this.recognition && !this.isListening.value) {
      try {
        this.recognition.start();
      } catch (error) {
        this.errorSubject.next('Error starting speech recognition');
      }
    }
  }

  /**
   * Stop listening for voice input
   */
  stopListening(): void {
    if (this.recognition && this.isListening.value) {
      this.recognition.stop();
    }
  }

  /**
   * Convert text to speech with enhanced voice settings
   */
  speak(text: string, settings?: Partial<VoiceSettings>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSpeechSynthesisSupported()) {
        reject(new Error('Speech synthesis is not supported in this browser'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      // Wait a bit for the cancel to take effect
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        const voiceSettings = { ...this.defaultVoiceSettings, ...settings };

        utterance.rate = voiceSettings.rate;
        utterance.pitch = voiceSettings.pitch;
        utterance.volume = voiceSettings.volume;

        // Get available voices and select the best one
        const voices = this.synthesis.getVoices();
        
        if (settings?.voiceName) {
          const voice = voices.find(v => v.name === settings.voiceName);
          if (voice) {
            utterance.voice = voice;
          }
        } else {
          // Priority order for voice selection
          const preferredVoices = [
            // Female voices - higher quality
            'Microsoft Zira Desktop - English (United States)',
            'Microsoft Hazel Desktop - English (Great Britain)',
            'Google UK English Female',
            'Samantha',
            'Victoria',
            'Karen',
            'Moira',
            // Any female voice
            ...voices.filter(v => 
              v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('woman') ||
              v.lang.includes('en')
            ).map(v => v.name)
          ];

          for (const voiceName of preferredVoices) {
            const voice = voices.find(v => v.name === voiceName);
            if (voice) {
              utterance.voice = voice;
              break;
            }
          }

          // Fallback to any English voice
          if (!utterance.voice) {
            const englishVoice = voices.find(v => v.lang.startsWith('en'));
            if (englishVoice) {
              utterance.voice = englishVoice;
            }
          }
        }

        console.log('Speaking with voice:', utterance.voice?.name || 'default');

        utterance.onstart = () => {
          console.log('Speech synthesis started');
        };

        utterance.onend = () => {
          console.log('Speech synthesis ended');
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };

        // Ensure voices are loaded before speaking
        if (voices.length === 0) {
          this.synthesis.onvoiceschanged = () => {
            this.synthesis.speak(utterance);
          };
        } else {
          this.synthesis.speak(utterance);
        }
      }, 100);
    });
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSpeechSynthesisSupported()) {
      return [];
    }
    return this.synthesis.getVoices();
  }

  /**
   * Cancel any ongoing speech
   */
  cancelSpeech(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  /**
   * Set default voice settings
   */
  setDefaultVoiceSettings(settings: Partial<VoiceSettings>): void {
    this.defaultVoiceSettings = { ...this.defaultVoiceSettings, ...settings };
  }
}
