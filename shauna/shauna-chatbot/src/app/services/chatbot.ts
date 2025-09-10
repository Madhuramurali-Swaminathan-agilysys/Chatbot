import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { retry, catchError, delay, switchMap, map, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  message: string;
  attachments?: Array<{
    name: string;
    content: string;
    type: string;
    size: number;
  }>;
}

export interface ChatResponse {
  response: string;
  timestamp: string;
  status: string;
}

export interface HealthResponse {
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = environment.apiUrl;
  private chatEndpoint = environment.chatEndpoint;
  private healthEndpoint = environment.healthEndpoint;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor(private http: HttpClient) { }

  /**
   * Send a chat message to the API
   */
  sendMessage(message: string, files?: File[]): Observable<ChatResponse> {
    // Use different endpoints based on whether files are attached
    const hasFiles = files && files.length > 0;
    const url = hasFiles ? `${this.apiUrl}/chat/upload` : `${this.apiUrl}/chat`;
    
    if (hasFiles) {
      // Convert files to attachments and send to upload endpoint
      return this.convertFilesToAttachments(files).pipe(
        switchMap(attachments => {
          const body = { 
            message: message,
            attachments: attachments 
          };
          const headers = new HttpHeaders({
            'Content-Type': 'application/json'
          });
          return this.http.post<ChatResponse>(url, body, { headers });
        }),
        retry(this.maxRetries),
        catchError(this.handleError)
      );
    } else {
      // Send JSON for text-only messages to regular chat endpoint
      const body = { 
        message: message,
        attachments: [] 
      };
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      return this.http.post<ChatResponse>(url, body, { headers }).pipe(
        retry(this.maxRetries),
        catchError(this.handleError)
      );
    }
  }

  /**
   * Convert files to attachments array
   */
  private convertFilesToAttachments(files: File[]): Observable<Array<{name: string, content: string, type: string, size: number}>> {
    return new Observable(observer => {
      const attachments: Array<{name: string, content: string, type: string, size: number}> = [];
      let processedCount = 0;

      if (files.length === 0) {
        observer.next([]);
        observer.complete();
        return;
      }

      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            // Remove the data URL prefix to get just the base64 content
            const base64 = (reader.result as string).split(',')[1];
            attachments.push({
              name: file.name,
              content: base64,
              type: file.type,
              size: file.size
            });
          }
          processedCount++;
          if (processedCount === files.length) {
            observer.next(attachments);
            observer.complete();
          }
        };
        reader.onerror = error => {
          console.error(`Error processing file ${file.name}:`, error);
          processedCount++;
          if (processedCount === files.length) {
            observer.next(attachments);
            observer.complete();
          }
        };
        reader.readAsDataURL(file);
      });
    });
  }

  /**
   * Check API health status
   */
  checkHealth(): Observable<boolean> {
    const url = `${this.apiUrl}/health`;
    
    return this.http.get<HealthResponse>(url).pipe(
      timeout(5000),
      map((response: HealthResponse) => response.status === 'healthy'),
      catchError((error) => {
        console.error('Health check failed:', error);
        return of(false);
      })
    );
  }

  /**
   * Send message with retry logic and rate limiting
   */
  sendMessageWithRetry(message: string, files?: File[]): Observable<ChatResponse> {
    return timer(0).pipe(
      switchMap(() => this.sendMessage(message, files)),
      retry({
        count: this.maxRetries,
        delay: (error, retryCount) => {
          if (retryCount <= this.maxRetries) {
            return timer(this.retryDelay * retryCount);
          }
          return throwError(() => error);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        case 503:
          errorMessage = 'Service unavailable. The chatbot is temporarily down.';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    console.error('ChatbotService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  };
}
