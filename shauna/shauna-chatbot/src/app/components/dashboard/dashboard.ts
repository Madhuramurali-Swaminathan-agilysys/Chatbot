import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ChatHistoryService, ChatSession, ChatHistoryItem } from '../../services/chat-history';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  chatSessions: ChatSession[] = [];
  filteredSessions: ChatSession[] = [];
  searchKeyword = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedSession: ChatSession | null = null;
  brandingInfo: any = {};

  private subscriptions = new Subscription();

  constructor(private chatHistoryService: ChatHistoryService) {}

  ngOnInit(): void {
    this.loadBrandingInfo();
    
    this.subscriptions.add(
      this.chatHistoryService.chatSessions$.subscribe(sessions => {
        this.chatSessions = sessions.slice(0, 10); // Get last 10 sessions
        this.filteredSessions = [...this.chatSessions];
      })
    );

    this.subscriptions.add(
      this.chatHistoryService.currentSession$.subscribe(session => {
        this.selectedSession = session;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadBrandingInfo(): void {
    // In a real app, you'd load this from a service
    // For now, we'll use the branding info directly
    fetch('/assets/branding.json')
      .then(response => response.json())
      .then(data => {
        this.brandingInfo = data.chatbot;
      })
      .catch(error => {
        console.error('Error loading branding info:', error);
        // Fallback branding info
        this.brandingInfo = {
          name: 'Shauna',
          description: 'AI Assistant',
          version: '1.0.0',
          company: 'AI Solutions Inc.'
        };
      });
  }

  onSearch(): void {
    this.filterSessions();
  }

  onDateRangeChange(): void {
    this.filterSessions();
  }

  private filterSessions(): void {
    let filtered = [...this.chatSessions];

    // Filter by search keyword
    if (this.searchKeyword.trim()) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        session.messages.some(message =>
          message.userMessage.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
          message.botResponse.toLowerCase().includes(this.searchKeyword.toLowerCase())
        )
      );
    }

    // Filter by date range
    if (this.startDate && this.endDate) {
      filtered = filtered.filter(session =>
        session.startTime >= this.startDate! && session.startTime <= this.endDate!
      );
    }

    this.filteredSessions = filtered;
  }

  loadSession(session: ChatSession): void {
    this.chatHistoryService.loadSession(session.id);
  }

  deleteSession(session: ChatSession, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this chat session?')) {
      this.chatHistoryService.deleteSession(session.id);
    }
  }

  clearAllHistory(): void {
    if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      this.chatHistoryService.clearAllHistory();
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  getMessageCount(session: ChatSession): number {
    return session.messages.length;
  }

  getSessionPreview(session: ChatSession): string {
    if (session.messages.length === 0) return 'No messages';
    const firstMessage = session.messages[0].userMessage;
    return firstMessage.length > 100 ? firstMessage.substring(0, 100) + '...' : firstMessage;
  }

  hasVoiceMessages(session: ChatSession): boolean {
    return session.messages.some(message => message.isVoiceInput || message.isVoiceOutput);
  }

  hasFileAttachments(session: ChatSession): boolean {
    return session.messages.some(message => message.files && message.files.length > 0);
  }

  trackBySessionId(index: number, session: ChatSession): string {
    return session.id;
  }
}
