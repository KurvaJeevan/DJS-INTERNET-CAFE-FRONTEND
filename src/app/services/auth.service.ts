import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppUser {
  _id: string;
  name: string;
  username: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  lastLoginAt?: string | null;
}

const TOKEN_KEY = 'djs-cafe-token';
const USER_KEY  = 'djs-cafe-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl;

  /** Reactive current-user signal — null when logged out. */
  readonly currentUser = signal<AppUser | null>(this.readStoredUser());

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  private readStoredUser(): AppUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.base}/auth/login`, { username, password }).pipe(
      tap((res: any) => {
        const { token, user } = res.data;
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  fetchMe(): Observable<any> {
    return this.http.get(`${this.base}/auth/me`).pipe(
      tap((res: any) => {
        const user = res.data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.base}/auth/change-password`, { currentPassword, newPassword });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // ── Admin-only user management ──
  listUsers(): Observable<any> {
    return this.http.get(`${this.base}/auth/users`);
  }
  createUser(data: any): Observable<any> {
    return this.http.post(`${this.base}/auth/users`, data);
  }
  updateUser(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.base}/auth/users/${id}`, data);
  }
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.base}/auth/users/${id}`);
  }
}
