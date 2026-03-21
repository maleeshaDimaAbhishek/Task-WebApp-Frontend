import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, of, tap } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  name?: string;
  birthDate: string;
  status?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
}

export interface RegisterResponse {
  id: number;
  userName: string;
  name: string;
  email: string;
  status: string;
}

export interface CurrentUser {
  id: number;
  userName: string;
  name: string;
  email: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = 'http://localhost:8080';
  private readonly TOKEN_KEY = 'jwt_token';

  private loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  private currentUser$ = new BehaviorSubject<CurrentUser | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/api/auth/login`, credentials).pipe(
      map((res) => {
        if (!res?.token) {
          throw new Error('JWT token not found in login response.');
        }
        return res;
      }),
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.token as string);
        this.loggedIn$.next(true);
        this.currentUser$.next(null);
      })
    );
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/api/auth/register`, payload);
  }

  getCurrentUser(forceRefresh = false): Observable<CurrentUser> {
    const cached = this.currentUser$.getValue();
    if (!forceRefresh && cached) {
      return of(cached);
    }

    return this.http.get<CurrentUser>(`${this.API_URL}/api/auth/me`).pipe(
      tap((user) => this.currentUser$.next(user))
    );
  }

  isAdminSnapshot(): boolean {
    const user = this.currentUser$.getValue();
    if (!user) return false;
    return (user.status || '').toUpperCase() === 'ADMIN';
  }

  isAdmin(): Observable<boolean> {
    return this.currentUser$.pipe(
      map((user) => (user?.status || '').toUpperCase() === 'ADMIN')
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.loggedIn$.next(false);
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  isLoggedInSnapshot(): boolean {
    return this.loggedIn$.getValue();
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
