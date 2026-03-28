import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

const BASE_URL = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders(this.auth.getAuthHeaders());
  }

  // ── Documents ─────────────────────────────────────────────
  uploadDocument(formData: FormData): Observable<any> {
    return this.http.post(`${BASE_URL}/documents/upload`, formData, { headers: this.headers() });
  }

  getDocuments(): Observable<any[]> {
    return this.http.get<any[]>(`${BASE_URL}/documents/`, { headers: this.headers() });
  }

  deleteDocument(docId: number): Observable<any> {
    return this.http.delete(`${BASE_URL}/documents/${docId}`, { headers: this.headers() });
  }

  downloadDocument(docId: number): Observable<Blob> {
    return this.http.get(`${BASE_URL}/documents/${docId}/download`, {
      headers: this.headers(),
      responseType: 'blob'
    });
  }

  getDocumentText(docId: number): Observable<{ text: string }> {
    return this.http.get<{ text: string }>(`${BASE_URL}/documents/${docId}/text`, { headers: this.headers() });
  }

  // ── Analysis ──────────────────────────────────────────────
  startAnalysis(docId: number): Observable<any> {
    return this.http.post(`${BASE_URL}/analysis/start/${docId}`, {}, { headers: this.headers() });
  }

  getAnalysisResult(taskId: string): Observable<any> {
    return this.http.get(`${BASE_URL}/analysis/result/${taskId}`, { headers: this.headers() });
  }

  cancelAnalysis(taskId: string): Observable<any> {
    return this.http.delete(`${BASE_URL}/analysis/cancel/${taskId}`, { headers: this.headers() });
  }

  retryAnalysis(taskId: string): Observable<any> {
    return this.http.post(`${BASE_URL}/analysis/retry/${taskId}`, {}, { headers: this.headers() });
  }

  getAnalysisHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${BASE_URL}/analysis/history`, { headers: this.headers() });
  }
}
