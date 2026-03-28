import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

const BASE_URL = 'http://localhost:8000';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private http: HttpClient, private router: Router) {}

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${BASE_URL}/auth/register`, { username, email, password });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${BASE_URL}/auth/login`, { email, password }).pipe(
      tap((res: any) => {
        localStorage.setItem(TOKEN_KEY, res.token.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): any {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
