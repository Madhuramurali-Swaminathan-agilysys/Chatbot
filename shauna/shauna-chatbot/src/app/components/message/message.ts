import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface MessageData {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  files?: Array<{name: string, size: number, type: string}>;
  isVoiceInput?: boolean;
  isVoiceOutput?: boolean;
  isLoading?: boolean;
}

@Component({
  selector: 'app-message',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './message.html',
  styleUrl: './message.scss'
})
export class MessageComponent implements OnInit {
  @Input() message!: MessageData;
  @Input() showAvatar = true;
  @Input() showTimestamp = true;

  formattedContent = '';

  ngOnInit(): void {
    this.formatContent();
  }

  private formatContent(): void {
    if (!this.message.content) {
      this.formattedContent = '';
      return;
    }

    // Basic markdown-like formatting
    let formatted = this.message.content;
    
    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code blocks
    formatted = formatted.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
    
    // Inline code
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Links
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    this.formattedContent = formatted;
  }

  getFileIcon(file: {name: string, size: number, type: string}): string {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'picture_as_pdf';
    if (file.type.includes('word')) return 'description';
    return 'attach_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getAvatarText(): string {
    return this.message.isUser ? 'U' : 'S';
  }

  getAvatarColor(): string {
    return this.message.isUser ? '#2196f3' : '#9c27b0';
  }
}
