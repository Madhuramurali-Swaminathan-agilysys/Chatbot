import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatHistoryItem {
  id: string;
  timestamp: Date;
  userMessage: string;
  botResponse: string;
  files?: Array<{name: string, size: number, type: string}>;
  isVoiceInput?: boolean;
  isVoiceOutput?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  startTime: Date;
  lastActivity: Date;
  messages: ChatHistoryItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatHistoryService {
  private readonly STORAGE_KEY = 'shauna_chat_history';
  private readonly MAX_SESSIONS = 10;
  private readonly MAX_MESSAGES_PER_SESSION = 100;

  private chatSessionsSubject = new BehaviorSubject<ChatSession[]>([]);
  private currentSessionSubject = new BehaviorSubject<ChatSession | null>(null);

  public chatSessions$ = this.chatSessionsSubject.asObservable();
  public currentSession$ = this.currentSessionSubject.asObservable();

  constructor() {
    this.loadChatHistory();
  }

  /**
   * Load chat history from localStorage
   */
  private loadChatHistory(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const sessions: ChatSession[] = JSON.parse(stored);
        // Convert string dates back to Date objects
        sessions.forEach(session => {
          session.startTime = new Date(session.startTime);
          session.lastActivity = new Date(session.lastActivity);
          session.messages.forEach(message => {
            message.timestamp = new Date(message.timestamp);
          });
        });
        this.chatSessionsSubject.next(sessions);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.chatSessionsSubject.next([]);
    }
  }

  /**
   * Save chat history to localStorage
   */
  private saveChatHistory(): void {
    try {
      const sessions = this.chatSessionsSubject.value;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  /**
   * Create a new chat session
   */
  createNewSession(): ChatSession {
    const newSession: ChatSession = {
      id: this.generateId(),
      title: `Chat ${new Date().toLocaleString()}`,
      startTime: new Date(),
      lastActivity: new Date(),
      messages: []
    };

    const sessions = this.chatSessionsSubject.value;
    sessions.unshift(newSession);

    // Keep only the latest sessions
    if (sessions.length > this.MAX_SESSIONS) {
      sessions.splice(this.MAX_SESSIONS);
    }

    this.chatSessionsSubject.next([...sessions]);
    this.currentSessionSubject.next(newSession);
    this.saveChatHistory();

    return newSession;
  }

  /**
   * Add a message to the current session
   */
  addMessage(userMessage: string, botResponse: string, files?: File[], isVoiceInput = false, isVoiceOutput = false): void {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession) {
      this.createNewSession();
      return this.addMessage(userMessage, botResponse, files, isVoiceInput, isVoiceOutput);
    }

    const message: ChatHistoryItem = {
      id: this.generateId(),
      timestamp: new Date(),
      userMessage,
      botResponse,
      files: files?.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })),
      isVoiceInput,
      isVoiceOutput
    };

    currentSession.messages.push(message);
    currentSession.lastActivity = new Date();
    
    // Update session title with first message if it's the default title
    if (currentSession.messages.length === 1 && currentSession.title.startsWith('Chat ')) {
      currentSession.title = userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
    }

    // Keep only the latest messages
    if (currentSession.messages.length > this.MAX_MESSAGES_PER_SESSION) {
      currentSession.messages.splice(0, currentSession.messages.length - this.MAX_MESSAGES_PER_SESSION);
    }

    this.currentSessionSubject.next({ ...currentSession });
    this.updateSessionInList(currentSession);
    this.saveChatHistory();
  }

  /**
   * Update a session in the sessions list
   */
  private updateSessionInList(updatedSession: ChatSession): void {
    const sessions = this.chatSessionsSubject.value;
    const index = sessions.findIndex(s => s.id === updatedSession.id);
    if (index !== -1) {
      sessions[index] = updatedSession;
      this.chatSessionsSubject.next([...sessions]);
    }
  }

  /**
   * Load a specific session
   */
  loadSession(sessionId: string): void {
    const sessions = this.chatSessionsSubject.value;
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      this.currentSessionSubject.next(session);
    }
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): void {
    const sessions = this.chatSessionsSubject.value.filter(s => s.id !== sessionId);
    this.chatSessionsSubject.next(sessions);
    
    // If the deleted session was the current one, clear current session
    const currentSession = this.currentSessionSubject.value;
    if (currentSession && currentSession.id === sessionId) {
      this.currentSessionSubject.next(null);
    }
    
    this.saveChatHistory();
  }

  /**
   * Search messages by keyword
   */
  searchMessages(keyword: string): ChatHistoryItem[] {
    const sessions = this.chatSessionsSubject.value;
    const results: ChatHistoryItem[] = [];
    
    sessions.forEach(session => {
      session.messages.forEach(message => {
        if (message.userMessage.toLowerCase().includes(keyword.toLowerCase()) ||
            message.botResponse.toLowerCase().includes(keyword.toLowerCase())) {
          results.push(message);
        }
      });
    });
    
    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Filter messages by date range
   */
  filterMessagesByDateRange(startDate: Date, endDate: Date): ChatHistoryItem[] {
    const sessions = this.chatSessionsSubject.value;
    const results: ChatHistoryItem[] = [];
    
    sessions.forEach(session => {
      session.messages.forEach(message => {
        if (message.timestamp >= startDate && message.timestamp <= endDate) {
          results.push(message);
        }
      });
    });
    
    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get the last 10 chat sessions
   */
  getRecentSessions(): ChatSession[] {
    return this.chatSessionsSubject.value.slice(0, 10);
  }

  /**
   * Clear all chat history
   */
  clearAllHistory(): void {
    this.chatSessionsSubject.next([]);
    this.currentSessionSubject.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get current session or create a new one
   */
  getCurrentOrCreateSession(): ChatSession {
    const current = this.currentSessionSubject.value;
    return current || this.createNewSession();
  }
}
