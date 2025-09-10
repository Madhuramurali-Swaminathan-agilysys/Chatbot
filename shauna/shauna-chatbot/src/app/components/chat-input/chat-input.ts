import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Subscription } from 'rxjs';

import { VoiceService } from '../../services/voice';

@Component({
  selector: 'app-chat-input',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    CdkTextareaAutosize
  ],
  templateUrl: './chat-input.html',
  styleUrl: './chat-input.scss'
})
export class ChatInputComponent implements OnInit, OnDestroy {
  @Output() messageSubmitted = new EventEmitter<{message: string, files: File[], isVoiceInput: boolean}>();
  @Output() filesSelected = new EventEmitter<File[]>();

  message = '';
  selectedFiles: File[] = [];
  isListening = false;
  isLoading = false;
  lastMessageWasVoice = false; // Track if last message was from voice
  maxFileSize = 10 * 1024 * 1024; // 10MB
  allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  private subscriptions = new Subscription();

  constructor(private voiceService: VoiceService) {}

  ngOnInit(): void {
    // Subscribe to voice service events
    this.subscriptions.add(
      this.voiceService.isListening$.subscribe(listening => {
        this.isListening = listening;
      })
    );

    this.subscriptions.add(
      this.voiceService.transcription$.subscribe(transcription => {
        this.message = transcription;
        this.lastMessageWasVoice = true;
        // Auto-submit voice transcriptions for immediate processing
        setTimeout(() => {
          if (this.message.trim()) {
            this.submitVoiceMessage();
          }
        }, 500); // Small delay to ensure transcription is complete
      })
    );

    this.subscriptions.add(
      this.voiceService.error$.subscribe(error => {
        console.error('Voice error:', error);
        // You could show a snackbar here
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSubmit(): void {
    if (this.message.trim() || this.selectedFiles.length > 0) {
      this.isLoading = true;
      this.messageSubmitted.emit({
        message: this.message.trim(),
        files: [...this.selectedFiles],
        isVoiceInput: this.lastMessageWasVoice
      });
      this.clearInput();
    }
  }

  submitVoiceMessage(): void {
    if (this.message.trim()) {
      this.isLoading = true;
      this.messageSubmitted.emit({
        message: this.message.trim(),
        files: [...this.selectedFiles],
        isVoiceInput: true
      });
      this.clearInput();
    }
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    this.processSelectedFiles(files);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
      this.processSelectedFiles(files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private processSelectedFiles(files: FileList): void {
    const validFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!this.isValidFileType(file)) {
        alert(`File type not supported: ${file.name}`);
        continue;
      }
      
      if (file.size > this.maxFileSize) {
        alert(`File too large: ${file.name}. Maximum size is 10MB.`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    this.selectedFiles = [...this.selectedFiles, ...validFiles];
    this.filesSelected.emit(this.selectedFiles);
  }

  private isValidFileType(file: File): boolean {
    return this.allowedFileTypes.includes(file.type);
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.filesSelected.emit(this.selectedFiles);
  }

  toggleVoiceInput(): void {
    if (!this.voiceService.isSpeechRecognitionSupported()) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (this.isListening) {
      this.voiceService.stopListening();
    } else {
      this.voiceService.startListening();
    }
  }

  clearInput(): void {
    this.message = '';
    this.selectedFiles = [];
    this.isLoading = false;
    this.lastMessageWasVoice = false;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  getFileIcon(file: File): string {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'picture_as_pdf';
    if (file.type.includes('word')) return 'description';
    return 'attach_file';
  }
}
