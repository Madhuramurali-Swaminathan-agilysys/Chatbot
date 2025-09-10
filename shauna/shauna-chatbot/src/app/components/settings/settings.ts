import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AudioService, AudioSettings } from '../../services/audio';

@Component({
  selector: 'app-settings',
  imports: [
    CommonModule,
    MatDialogModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    FormsModule
  ],
  template: `
    <div class="settings-dialog">
      <h2 mat-dialog-title>
        <mat-icon>settings</mat-icon>
        Audio Settings
      </h2>
      
      <mat-dialog-content class="settings-content">
        <!-- Loading Music Settings -->
        <div class="setting-group">
          <h3>Loading Music</h3>
          <div class="setting-item">
            <mat-slide-toggle 
              [(ngModel)]="settings.loadingMusicEnabled"
              (change)="updateSettings()">
              Play music while waiting for response
            </mat-slide-toggle>
          </div>
          <div class="setting-item" *ngIf="settings.loadingMusicEnabled">
            <label>Loading Music Volume</label>
            <mat-slider 
              [min]="0" 
              [max]="1" 
              [step]="0.1"
              [(ngModel)]="settings.loadingMusicVolume"
              (change)="updateSettings()"
              thumbLabel>
            </mat-slider>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Voice Response Settings -->
        <div class="setting-group">
          <h3>Voice Response</h3>
          <div class="setting-item">
            <mat-slide-toggle 
              [(ngModel)]="settings.voiceResponseEnabled"
              (change)="updateSettings()">
              Read responses aloud for voice input
            </mat-slide-toggle>
          </div>
          <div class="setting-item" *ngIf="settings.voiceResponseEnabled">
            <label>Voice Response Volume</label>
            <mat-slider 
              [min]="0" 
              [max]="1" 
              [step]="0.1"
              [(ngModel)]="settings.voiceResponseVolume"
              (change)="updateSettings()"
              thumbLabel>
            </mat-slider>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Test Controls -->
        <div class="setting-group">
          <h3>Test Audio</h3>
          <div class="setting-item">
            <button mat-raised-button color="primary" (click)="testLoadingMusic()" [disabled]="!settings.loadingMusicEnabled">
              <mat-icon>play_arrow</mat-icon>
              Test Loading Music
            </button>
            <button mat-raised-button color="accent" (click)="testVoiceResponse()" [disabled]="!settings.voiceResponseEnabled">
              <mat-icon>record_voice_over</mat-icon>
              Test Voice Response
            </button>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="close()">Close</button>
        <button mat-raised-button color="primary" (click)="resetDefaults()">Reset to Defaults</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .settings-dialog {
      min-width: 400px;
      max-width: 500px;
    }

    .settings-content {
      padding: 20px 0;
    }

    .setting-group {
      margin: 20px 0;
    }

    .setting-group h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-weight: 500;
    }

    .setting-item {
      margin: 15px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .setting-item label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }

    .setting-item button {
      margin-right: 10px;
      margin-bottom: 10px;
    }

    mat-slider {
      width: 100%;
    }

    mat-divider {
      margin: 20px 0;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
  `]
})
export class SettingsComponent implements OnInit, OnDestroy {
  settings: AudioSettings = {
    loadingMusicEnabled: true,
    voiceResponseEnabled: true,
    loadingMusicVolume: 0.5,
    voiceResponseVolume: 0.8
  };

  private subscriptions = new Subscription();

  constructor(
    private audioService: AudioService,
    private dialogRef: MatDialogRef<SettingsComponent>
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.audioService.settings$.subscribe(settings => {
        this.settings = { ...settings };
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  updateSettings(): void {
    this.audioService.updateSettings(this.settings);
  }

  testLoadingMusic(): void {
    this.audioService.playLoadingMusic();
    setTimeout(() => {
      this.audioService.stopLoadingMusic();
    }, 3000); // Play for 3 seconds
  }

  testVoiceResponse(): void {
    // This would require injecting VoiceService
    // For now, we'll just show a message
    console.log('Voice response test - this would speak sample text');
  }

  resetDefaults(): void {
    const defaultSettings: AudioSettings = {
      loadingMusicEnabled: true,
      voiceResponseEnabled: true,
      loadingMusicVolume: 0.5,
      voiceResponseVolume: 0.8
    };
    this.settings = { ...defaultSettings };
    this.audioService.updateSettings(defaultSettings);
  }

  close(): void {
    this.dialogRef.close();
  }
}
