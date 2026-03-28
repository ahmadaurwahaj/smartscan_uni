import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const BASE_URL = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(private http: HttpClient) {}

  // Documents
  uploadDocument(formData: FormData): Observable<any> {
    return this.http.post(`${BASE_URL}/documents/upload`, formData);
  }

  getDocuments(): Observable<any[]> {
    return this.http.get<any[]>(`${BASE_URL}/documents/`);
  }

  deleteDocument(docId: number): Observable<any> {
    return this.http.delete(`${BASE_URL}/documents/${docId}`);
  }

  // Analysis
  startAnalysis(docId: number): Observable<any> {
    return this.http.post(`${BASE_URL}/analysis/start/${docId}`, {});
  }

  getAnalysisResult(taskId: string): Observable<any> {
    return this.http.get(`${BASE_URL}/analysis/result/${taskId}`);
  }
}
