/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: auth.service.ts
 * Description: Authentication service for managing user login, registration, and JWT tokens
 * Created: 2025-10-26
 */

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/entities/user.entity';
import { LoginResponse, RegisterRequest } from '../models/contracts/auth.contracts';

/**
 * AuthService - handles authentication operations
 * @remarks Manages JWT tokens, user session, and auth state
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Base URL for auth API endpoints
   */
  private readonly API_URL = `${environment.apiUrl}/v1/auth`;

  /**
   * Current user subject
   */
  private currentUserSubject: BehaviorSubject<User | null>;

  /**
   * Current user observable
   */
  public currentUser: Observable<User | null>;

  /**
   * Flag to check if code is running in browser
   */
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Initialize with user from storage if exists (only in browser)
    const token = this.isBrowser ? this.getToken() : null;
    const user = token ? this.decodeToken(token) : null;
    this.currentUserSubject = new BehaviorSubject<User | null>(user);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  /**
   * Get current user value
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Login user with email and password
   * @param email - User email
   * @param password - User password
   * @param recaptchaToken - reCAPTCHA token (optional)
   * @param rememberMe - Store token in localStorage (true) or sessionStorage (false)
   * @returns Observable with login response containing JWT token
   */
  login(email: string, password: string, recaptchaToken?: string, rememberMe: boolean = false): Observable<LoginResponse> {
    const body: any = { email, password };
    if (recaptchaToken) {
      body.recaptchaToken = recaptchaToken;
    }

    return this.http.post<LoginResponse>(`${this.API_URL}/login`, body)
      .pipe(
        map(response => {
          // Store token and update user data if login successful (no 2FA required)
          if (response.access_token && !response.requires2FA) {
            this.setToken(response.access_token, rememberMe);
            const user = this.decodeToken(response.access_token);
            this.currentUserSubject.next(user);
          }
          return response;
        })
      );
  }

  /**
   * Verify 2FA token and complete login
   * @param email - User email
   * @param token - 2FA token from authenticator app
   * @param rememberMe - Store token in localStorage (true) or sessionStorage (false)
   * @returns Observable with login response containing JWT token
   */
  verify2FALogin(email: string, token: string, rememberMe: boolean = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/2fa/authenticate`, { email, token })
      .pipe(
        map(response => {
          // Store token and update user data
          if (response.access_token) {
            this.setToken(response.access_token, rememberMe);
            const user = this.decodeToken(response.access_token);
            this.currentUserSubject.next(user);
          }
          return response;
        })
      );
  }

  /**
   * Register new user
   * @param data - Registration data
   * @param recaptchaToken - reCAPTCHA token (optional)
   * @param rememberMe - Store token in localStorage (true) or sessionStorage (false)
   * @returns Observable with registration response
   */
  register(data: RegisterRequest, recaptchaToken?: string, rememberMe: boolean = false): Observable<LoginResponse> {
    const body: any = { ...data };
    if (recaptchaToken) {
      body.recaptchaToken = recaptchaToken;
    }

    return this.http.post<LoginResponse>(`${this.API_URL}/register`, body)
      .pipe(
        map(response => {
          // Store token and update user data
          if (response.access_token) {
            this.setToken(response.access_token, rememberMe);
            const user = this.decodeToken(response.access_token);
            this.currentUserSubject.next(user);
          }
          return response;
        })
      );
  }

  /**
   * Logout user and clear session
   */
  logout(): void {
    // Clear token from storage (only in browser)
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
    }

    // Clear current user
    this.currentUserSubject.next(null);
  }

  /**
   * Check if user is authenticated
   * @returns true if user has valid token
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Check if token is expired
    return !this.isTokenExpired(token);
  }

  /**
   * Get JWT token from storage
   * @returns JWT token string or null
   */
  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem('access_token') ||
           sessionStorage.getItem('access_token');
  }

  /**
   * Set JWT token in storage
   * @param token - JWT token string
   * @param rememberMe - Store in localStorage (true) or sessionStorage (false)
   */
  private setToken(token: string, rememberMe: boolean = false): void {
    if (!this.isBrowser) {
      return;
    }
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('access_token', token);
  }

  /**
   * Get authorization header with Bearer token
   * @returns HttpHeaders with Authorization header
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Decode JWT token to extract user data
   * @param token - JWT token string
   * @returns User object or null
   */
  private decodeToken(token: string): User | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));

      return {
        id: decoded.sub || decoded.userId,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param token - JWT token string
   * @returns true if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));

      if (!decoded.exp) {
        return false;
      }

      const expirationDate = new Date(decoded.exp * 1000);
      return expirationDate < new Date();
    } catch (error) {
      return true;
    }
  }

  /**
   * Refresh user data from current token
   */
  refreshUser(): void {
    const token = this.getToken();
    if (token) {
      const user = this.decodeToken(token);
      this.currentUserSubject.next(user);
    }
  }
}
