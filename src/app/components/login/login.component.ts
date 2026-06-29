import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="login-page">
      <button class="theme-toggle theme-toggle-fixed" (click)="theme.toggle()">
        <mat-icon>{{ theme.mode() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>

      <div class="login-panel">
        <!-- Brand -->
        <a routerLink="/landing" class="login-brand">
          <div class="login-brand-icon">
            <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="url(#lglogin)"/>
              <defs>
                <linearGradient id="lglogin" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#6366f1"/>
                  <stop offset="100%" stop-color="#8b5cf6"/>
                </linearGradient>
              </defs>
              <rect x="8" y="10" width="24" height="16" rx="3" fill="none" stroke="white" stroke-width="2"/>
              <rect x="12" y="14" width="16" height="8" rx="1" fill="white" opacity="0.3"/>
              <line x1="15" y1="30" x2="25" y2="30" stroke="white" stroke-width="2" stroke-linecap="round"/>
              <line x1="20" y1="26" x2="20" y2="30" stroke="white" stroke-width="2"/>
            </svg>
          </div>
          <span>DJS Internet Cafe</span>
        </a>

        <h1 class="login-title">Welcome back</h1>
        <p class="login-subtitle">Sign in to manage your cafe's transactions, accounts, and reports.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="login-form">
          <mat-form-field appearance="outline">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username" autocomplete="username" (keyup.enter)="submit()">
            <mat-icon matPrefix style="margin-right:8px;color:var(--text-muted)">person</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password"
                   autocomplete="current-password" (keyup.enter)="submit()">
            <mat-icon matPrefix style="margin-right:8px;color:var(--text-muted)">lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword" tabindex="-1">
              <mat-icon style="color:var(--text-muted)">{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          <div class="login-error" *ngIf="errorMsg">
            <mat-icon>error_outline</mat-icon> {{ errorMsg }}
          </div>

          <button mat-flat-button type="submit" class="btn-primary login-submit" [disabled]="loading">
            <mat-spinner *ngIf="loading" diameter="20" style="display:inline-block;margin-right:8px"></mat-spinner>
            <span *ngIf="!loading">Sign In</span>
            <span *ngIf="loading">Signing in...</span>
          </button>
        </form>

        <a routerLink="/landing" class="back-link">
          <mat-icon style="font-size:16px!important">arrow_back</mat-icon> Back to home
        </a>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: var(--bg-base);
      position: relative;
      padding: 24px;
    }

    .theme-toggle-fixed { position: absolute; top: 24px; right: 24px; }

    .login-panel {
      width: 100%; max-width: 380px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 40px 36px;
      box-shadow: var(--shadow-card);
    }

    .login-brand {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; color: var(--text-primary);
      font-weight: 700; font-size: 14px;
      margin-bottom: 32px;
    }
    .login-brand-icon { width: 32px; height: 32px; }
    .login-brand-icon svg { width: 100%; height: 100%; }

    .login-title { font-size: 24px; font-weight: 700; letter-spacing: -0.01em; }
    .login-subtitle { font-size: 13px; color: var(--text-secondary); margin-top: 6px; margin-bottom: 28px; line-height: 1.5; }

    .login-form { display: flex; flex-direction: column; gap: 4px; }

    .login-error {
      display: flex; align-items: center; gap: 8px;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
      color: var(--accent-danger); border-radius: var(--radius-sm);
      padding: 10px 14px; font-size: 13px; margin-bottom: 8px;
    }
    .login-error mat-icon { font-size: 18px !important; flex-shrink: 0; }

    .login-submit {
      height: 48px !important; font-size: 14px !important; font-weight: 600 !important;
      margin-top: 8px;
    }

    .back-link {
      display: flex; align-items: center; gap: 6px; justify-content: center;
      margin-top: 24px; font-size: 13px; color: var(--text-muted);
      text-decoration: none;
    }
    .back-link:hover { color: var(--accent-primary); }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public theme: ThemeService
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  submit() {
    if (this.form.invalid) {
      this.errorMsg = 'Please enter both username and password';
      return;
    }
    this.errorMsg = '';
    this.loading = true;
    const { username, password } = this.form.value;

    this.auth.login(username, password).subscribe({
      next: () => {
        this.loading = false;
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
        this.router.navigateByUrl(redirectTo || '/dashboard');
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.error || 'Invalid username or password';
      }
    });
  }
}
