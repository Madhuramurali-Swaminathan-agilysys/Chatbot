import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { ChatInputComponent } from '../chat-input/chat-input';
import { MessageComponent, MessageData } from '../message/message';
import { ChatbotService, ChatResponse } from '../../services/chatbot';
import { VoiceService } from '../../services/voice';
import { ChatHistoryService } from '../../services/chat-history';
import { AudioService } from '../../services/audio';
import { SettingsComponent } from '../settings/settings';

@Component({
  selector: 'app-chat',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    ChatInputComponent,
    MessageComponent
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.scss'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages: MessageData[] = [];
  isApiHealthy = false;
  isCheckingHealth = true;
  isProcessing = false;
  
  private subscriptions = new Subscription();
  private shouldScrollToBottom = false;

  constructor(
    private chatbotService: ChatbotService,
    private voiceService: VoiceService,
    private chatHistoryService: ChatHistoryService,
    private audioService: AudioService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.checkApiHealth();
    this.loadCurrentSession();
    
    // Check API health periodically
    setInterval(() => this.checkApiHealth(), 30000); // Check every 30 seconds
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private checkApiHealth(): void {
    this.subscriptions.add(
      this.chatbotService.checkHealth().subscribe({
        next: (isHealthy: boolean) => {
          this.isApiHealthy = isHealthy;
          this.isCheckingHealth = false;
        },
        error: () => {
          this.isApiHealthy = false;
          this.isCheckingHealth = false;
        }
      })
    );
  }

  private loadCurrentSession(): void {
    this.subscriptions.add(
      this.chatHistoryService.currentSession$.subscribe(session => {
        if (session) {
          const userMessages = session.messages.map(item => ({
            id: item.id,
            content: item.userMessage,
            isUser: true,
            timestamp: item.timestamp,
            files: item.files,
            isVoiceInput: item.isVoiceInput,
            isVoiceOutput: false
          }));
          
          const botMessages = session.messages.map(item => ({
            id: item.id + '_bot',
            content: item.botResponse,
            isUser: false,
            timestamp: item.timestamp,
            files: undefined,
            isVoiceInput: false,
            isVoiceOutput: item.isVoiceOutput
          }));
          
          this.messages = [...userMessages, ...botMessages]
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          this.shouldScrollToBottom = true;
        }
      })
    );
  }

  onMessageSubmitted(event: {message: string, files: File[], isVoiceInput: boolean}): void {
    if (!this.isApiHealthy) {
      this.snackBar.open('Chatbot is not available. Please try again later.', 'Close', {
        duration: 3000
      });
      return;
    }

    // Add user message
    const userMessage: MessageData = {
      id: this.generateId(),
      content: event.message,
      isUser: true,
      timestamp: new Date(),
      files: event.files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      isVoiceInput: event.isVoiceInput
    };

    this.messages.push(userMessage);
    this.shouldScrollToBottom = true;

    // Add loading message for bot
    const loadingMessage: MessageData = {
      id: this.generateId(),
      content: '',
      isUser: false,
      timestamp: new Date(),
      isLoading: true
    };

    this.messages.push(loadingMessage);
    this.shouldScrollToBottom = true;
    this.isProcessing = true;

    // Play loading music if voice input was used
    if (event.isVoiceInput) {
      this.audioService.playLoadingMusic();
    }

    // Send message to API
    this.subscriptions.add(
      this.chatbotService.sendMessageWithRetry(event.message, event.files).subscribe({
        next: (response: ChatResponse) => {
          // Stop loading music
          this.audioService.stopLoadingMusic();
          this.handleBotResponse(response, event.isVoiceInput, loadingMessage.id, userMessage.content, event.files);
        },
        error: (error) => {
          // Stop loading music
          this.audioService.stopLoadingMusic();
          this.handleError(error, loadingMessage.id);
        }
      })
    );
  }

  private handleBotResponse(response: ChatResponse, wasVoiceInput: boolean, loadingMessageId: string, userMessage: string, files: File[]): void {
    // Remove loading message
    this.messages = this.messages.filter(m => m.id !== loadingMessageId);

    // Add bot response
    const botMessage: MessageData = {
      id: this.generateId(),
      content: response.response,
      isUser: false,
      timestamp: new Date(),
      isVoiceOutput: wasVoiceInput // Use voice output if input was voice
    };

    this.messages.push(botMessage);
    this.shouldScrollToBottom = true;
    this.isProcessing = false;

    // Save to chat history
    this.chatHistoryService.addMessage(
      userMessage,
      response.response,
      files,
      wasVoiceInput,
      wasVoiceInput
    );

    // Play voice response if it was voice input and voice response is enabled
    if (wasVoiceInput && this.voiceService.isSpeechSynthesisSupported()) {
      const audioSettings = this.audioService.getSettings();
      if (audioSettings.voiceResponseEnabled) {
        // Use louder voice settings for voice responses
        this.voiceService.speak(response.response, {
          volume: audioSettings.voiceResponseVolume,
          rate: 0.9,
          pitch: 1.1
        }).catch(error => {
          console.error('Error playing voice response:', error);
          this.snackBar.open('Could not play voice response', 'Close', { duration: 3000 });
        });
      }
    }
  }

  private handleError(error: any, loadingMessageId: string): void {
    // Remove loading message
    this.messages = this.messages.filter(m => m.id !== loadingMessageId);

    // Add error message
    const errorMessage: MessageData = {
      id: this.generateId(),
      content: 'Sorry, I encountered an error while processing your request. Please try again.',
      isUser: false,
      timestamp: new Date()
    };

    this.messages.push(errorMessage);
    this.shouldScrollToBottom = true;
    this.isProcessing = false;

    this.snackBar.open(error.message || 'An error occurred', 'Close', {
      duration: 5000
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  clearChat(): void {
    this.messages = [];
    this.chatHistoryService.createNewSession();
    this.snackBar.open('Chat cleared', 'Close', { duration: 2000 });
  }

  getApiStatusText(): string {
    if (this.isCheckingHealth) return 'Checking...';
    return this.isApiHealthy ? 'Shauna is Active' : 'Shauna is Inactive';
  }

  getApiStatusColor(): string {
    if (this.isCheckingHealth) return 'accent';
    return this.isApiHealthy ? 'primary' : 'warn';
  }

  trackByMessageId(index: number, message: MessageData): string {
    return message.id;
  }

  openSettings(): void {
    this.dialog.open(SettingsComponent, {
      width: '500px',
      disableClose: false
    });
  }
}
