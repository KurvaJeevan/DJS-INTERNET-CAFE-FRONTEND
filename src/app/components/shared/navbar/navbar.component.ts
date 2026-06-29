import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, MatIconModule, MatTooltipModule, MatMenuModule, TitleCasePipe],
  template: `
    <nav class="sidebar">
      <!-- Logo -->
      <a class="sidebar-logo" routerLink="/home">
        <div class="logo-icon">
          <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="url(#lg)"/>
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#6366f1"/>
                <stop offset="100%" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
            <rect x="8" y="10" width="24" height="16" rx="3" fill="none" stroke="white" stroke-width="2"/>
            <rect x="12" y="14" width="16" height="8" rx="1" fill="white" opacity="0.3"/>
            <line x1="15" y1="30" x2="25" y2="30" stroke="white" stroke-width="2" stroke-linecap="round"/>
            <line x1="20" y1="26" x2="20" y2="30" stroke="white" stroke-width="2"/>
            <circle cx="20" cy="18" r="2" fill="white" opacity="0.8"/>
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-name">DJS</span>
          <span class="logo-sub">Internet Cafe</span>
        </div>
      </a>

      <div class="sidebar-divider"></div>

      <!-- Nav items -->
      <ul class="nav-list">
        <li *ngFor="let item of navItems">
          <a class="nav-item"
             [routerLink]="item.path"
             routerLinkActive="active"
             [matTooltip]="item.label"
             matTooltipPosition="right">
            <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        </li>
      </ul>

      <!-- Theme toggle -->
      <div class="sidebar-theme-row">
        <button class="theme-toggle" (click)="theme.toggle()" matTooltip="Toggle theme" matTooltipPosition="right">
          <mat-icon>{{ theme.mode() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>
        <span class="theme-label">{{ theme.mode() === 'dark' ? 'Dark mode' : 'Light mode' }}</span>
      </div>

      <!-- User footer -->
      <div class="sidebar-footer" [matMenuTriggerFor]="userMenu">
        <div class="user-avatar">{{ initial }}</div>
        <div class="user-info">
          <div class="user-name">{{ auth.currentUser()?.name || 'User' }}</div>
          <div class="user-role">{{ auth.currentUser()?.role | titlecase }}</div>
        </div>
        <mat-icon class="user-menu-icon">expand_more</mat-icon>
      </div>

      <mat-menu #userMenu="matMenu" xPosition="after" yPosition="above">
        <a mat-menu-item routerLink="/settings">
          <mat-icon>settings</mat-icon> Settings
        </a>
        <button mat-menu-item (click)="auth.logout()">
          <mat-icon>logout</mat-icon> Sign Out
        </button>
      </mat-menu>
    </nav>
  `,
  styles: [`
    .sidebar {
      width: var(--nav-width);
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: sticky;
      top: 0;
      flex-shrink: 0;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      text-decoration: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .sidebar-logo:hover { opacity: 0.85; }

    .logo-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      filter: drop-shadow(0 0 8px rgba(99,102,241,0.4));
    }
    .logo-icon svg { width: 100%; height: 100%; }

    .logo-text { display: flex; flex-direction: column; line-height: 1.2; }
    .logo-name { font-size: 18px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; }
    .logo-sub  { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }

    .sidebar-divider {
      height: 1px;
      background: var(--border);
      margin: 0 16px 12px;
    }

    .nav-list {
      list-style: none;
      padding: 0 8px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      text-decoration: none;
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
      transition: all 0.18s;
      position: relative;
    }
    .nav-item:hover {
      background: var(--bg-card);
      color: var(--text-primary);
    }
    .nav-item.active {
      background: var(--accent-glow);
      color: var(--accent-primary);
      font-weight: 600;
    }
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      bottom: 6px;
      width: 3px;
      background: var(--accent-primary);
      border-radius: 0 3px 3px 0;
    }

    .nav-icon { font-size: 20px !important; width: 20px !important; height: 20px !important; flex-shrink: 0; }
    .nav-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .sidebar-theme-row {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px;
      border-top: 1px solid var(--border);
    }
    .sidebar-theme-row .theme-toggle { width: 30px; height: 30px; flex-shrink: 0; }
    .sidebar-theme-row .theme-toggle mat-icon { font-size: 16px !important; width: 16px; height: 16px; }
    .theme-label { font-size: 12px; color: var(--text-secondary); }

    .sidebar-footer {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px;
      border-top: 1px solid var(--border);
      cursor: pointer;
      transition: background 0.15s;
    }
    .sidebar-footer:hover { background: var(--bg-card-hover); }

    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--accent-glow); color: var(--accent-primary);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; flex-shrink: 0;
    }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 10px; color: var(--text-muted); }
    .user-menu-icon { font-size: 18px !important; color: var(--text-muted); flex-shrink: 0; }
  `]
})
export class NavbarComponent {
  constructor(public auth: AuthService, public theme: ThemeService) {}

  get initial() {
    return this.auth.currentUser()?.name?.charAt(0)?.toUpperCase() || '?';
  }

  navItems: NavItem[] = [
    { path: '/home',             label: 'Home',            icon: 'home' },
    { path: '/dashboard',        label: 'Dashboard',       icon: 'dashboard' },
    { path: '/transactions',     label: 'Transactions',    icon: 'receipt_long' },
    { path: '/expenses',         label: 'Expenses',        icon: 'shopping_cart' },
    { path: '/printers',         label: 'Printers',        icon: 'print' },
    { path: '/bank-accounts',    label: 'Bank Accounts',   icon: 'account_balance' },
    { path: '/cash-register',    label: 'Cash Register',   icon: 'point_of_sale' },
    { path: '/pan-applications', label: 'PAN Applications',icon: 'badge' },
    { path: '/analytics',        label: 'Analytics',       icon: 'insights' },
    { path: '/reports',          label: 'Reports',         icon: 'bar_chart' },
  ];
}
