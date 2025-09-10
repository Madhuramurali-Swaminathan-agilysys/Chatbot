import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AudioSettings {
  loadingMusicEnabled: boolean;
  voiceResponseEnabled: boolean;
  loadingMusicVolume: number;
  voiceResponseVolume: number;
}

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private loadingAudio: HTMLAudioElement | null = null;
  private settingsSubject = new BehaviorSubject<AudioSettings>({
    loadingMusicEnabled: true,
    voiceResponseEnabled: true,
    loadingMusicVolume: 0.5,
    voiceResponseVolume: 0.8
  });

  public settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.initializeLoadingAudio();
    this.loadSettings();
  }

  private initializeLoadingAudio(): void {
    try {
      this.loadingAudio = new Audio();
      
      // Try to load the loading.mp3 file, fallback to a generated tone
      this.loadingAudio.src = '/assets/loading.mp3';
      this.loadingAudio.loop = true;
      this.loadingAudio.volume = this.settingsSubject.value.loadingMusicVolume;
      
      // Handle case where loading.mp3 doesn't exist
      this.loadingAudio.onerror = () => {
        console.warn('Loading.mp3 not found, creating fallback audio');
        this.createFallbackAudio();
      };
      
      // Preload the audio
      this.loadingAudio.load();
    } catch (error) {
      console.warn('Loading music not available, creating fallback:', error);
      this.createFallbackAudio();
    }
  }

  private createFallbackAudio(): void {
    try {
      // Create a simple tone as fallback using Web Audio API
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.setValueAtTime(440, context.currentTime); // A4 note
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      
      // Store reference for later use
      (this as any).fallbackContext = context;
      (this as any).fallbackOscillator = oscillator;
      (this as any).fallbackGain = gainNode;
      
      console.log('Fallback audio tone created');
    } catch (error) {
      console.warn('Could not create fallback audio:', error);
    }
  }

  /**
   * Start playing loading music
   */
  playLoadingMusic(): void {
    const settings = this.settingsSubject.value;
    if (settings.loadingMusicEnabled) {
      if (this.loadingAudio) {
        try {
          this.loadingAudio.volume = settings.loadingMusicVolume;
          this.loadingAudio.currentTime = 0;
          this.loadingAudio.play().catch(error => {
            console.warn('Could not play loading music, trying fallback:', error);
            this.playFallbackAudio();
          });
        } catch (error) {
          console.warn('Error playing loading music:', error);
          this.playFallbackAudio();
        }
      } else {
        this.playFallbackAudio();
      }
    }
  }

  /**
   * Stop playing loading music
   */
  stopLoadingMusic(): void {
    if (this.loadingAudio) {
      try {
        this.loadingAudio.pause();
        this.loadingAudio.currentTime = 0;
      } catch (error) {
        console.warn('Error stopping loading music:', error);
      }
    }
    this.stopFallbackAudio();
  }

  private playFallbackAudio(): void {
    try {
      const context = (this as any).fallbackContext;
      const oscillator = (this as any).fallbackOscillator;
      
      if (context && oscillator) {
        if (context.state === 'suspended') {
          context.resume();
        }
        console.log('Playing fallback audio tone');
      }
    } catch (error) {
      console.warn('Could not play fallback audio:', error);
    }
  }

  private stopFallbackAudio(): void {
    try {
      const context = (this as any).fallbackContext;
      if (context && context.state === 'running') {
        context.suspend();
      }
    } catch (error) {
      console.warn('Could not stop fallback audio:', error);
    }
  }

  /**
   * Update audio settings
   */
  updateSettings(newSettings: Partial<AudioSettings>): void {
    const currentSettings = this.settingsSubject.value;
    const updatedSettings = { ...currentSettings, ...newSettings };
    this.settingsSubject.next(updatedSettings);
    this.saveSettings(updatedSettings);

    // Update loading audio volume if it exists
    if (this.loadingAudio && newSettings.loadingMusicVolume !== undefined) {
      this.loadingAudio.volume = newSettings.loadingMusicVolume;
    }
  }

  /**
   * Get current audio settings
   */
  getSettings(): AudioSettings {
    return this.settingsSubject.value;
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(settings: AudioSettings): void {
    try {
      localStorage.setItem('shauna-audio-settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Could not save audio settings:', error);
    }
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('shauna-audio-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.settingsSubject.next({ ...this.settingsSubject.value, ...settings });
      }
    } catch (error) {
      console.warn('Could not load audio settings:', error);
    }
  }

  /**
   * Check if loading music is available
   */
  isLoadingMusicAvailable(): boolean {
    return this.loadingAudio !== null;
  }
}
