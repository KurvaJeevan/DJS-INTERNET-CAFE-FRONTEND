import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

interface Module {
  path: string; label: string; icon: string;
  desc: string; color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, MatIconModule, MatRippleModule],
  template: `
    <div class="home-wrapper">
      <!-- Hero -->
      <div class="hero">
        <div class="hero-logo">
          <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <rect width="60" height="60" rx="16" fill="url(#hlg)"/>
            <defs>
              <linearGradient id="hlg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#6366f1"/>
                <stop offset="100%" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
            <rect x="10" y="14" width="40" height="24" rx="4" fill="none" stroke="white" stroke-width="2.5"/>
            <rect x="16" y="19" width="28" height="14" rx="2" fill="white" opacity="0.25"/>
            <circle cx="30" cy="26" r="4" fill="white" opacity="0.9"/>
            <line x1="22" y1="44" x2="38" y2="44" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="30" y1="38" x2="30" y2="44" stroke="white" stroke-width="2.5"/>
          </svg>
        </div>
        <div>
          <h1 class="hero-title">DJS Internet Cafe</h1>
          <p class="hero-subtitle">Business Management System — Track transactions, expenses, printers &amp; more</p>
        </div>
      </div>

      <!-- Quick stats bar -->
      <div class="today-bar">
        <div class="today-item">
          <mat-icon>today</mat-icon>
          <span>{{ today }}</span>
        </div>
        <div class="today-item">
          <mat-icon>schedule</mat-icon>
          <span>{{ time }}</span>
        </div>
        <div class="today-item accent">
          <mat-icon>storefront</mat-icon>
          <span>Cafe is Open</span>
        </div>
      </div>

      <!-- Modules grid -->
      <div class="modules-grid">
        <a *ngFor="let m of modules"
           [routerLink]="m.path"
           class="module-card"
           matRipple>
          <div class="module-icon" [style.background]="m.color + '22'" [style.color]="m.color">
            <mat-icon>{{ m.icon }}</mat-icon>
          </div>
          <div class="module-info">
            <div class="module-label">{{ m.label }}</div>
            <div class="module-desc">{{ m.desc }}</div>
          </div>
          <mat-icon class="module-arrow">chevron_right</mat-icon>
        </a>
      </div>

      <!-- Footer -->
      <div class="home-footer">
        <p>DJS Internet Cafe Management System &nbsp;·&nbsp; Built for your business</p>
      </div>
    </div>
  `,
  styles: [`
    .home-wrapper { max-width: 900px; margin: 0 auto; }

    .hero {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 32px 0 24px;
    }
    .hero-logo {
      width: 72px; height: 72px; flex-shrink: 0;
      filter: drop-shadow(0 0 20px rgba(99,102,241,0.5));
    }
    .hero-logo svg { width: 100%; height: 100%; }
    .hero-title { font-size: 32px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.03em; }
    .hero-subtitle { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

    .today-bar {
      display: flex;
      align-items: center;
      gap: 24px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 12px 20px;
      margin-bottom: 28px;
    }
    .today-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); }
    .today-item mat-icon { font-size: 18px !important; width: 18px; height: 18px; }
    .today-item.accent { color: var(--accent-success); margin-left: auto; }

    .modules-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .module-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 18px 20px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      overflow: hidden;
    }
    .module-card:hover {
      border-color: var(--border-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-card);
    }

    .module-icon {
      width: 48px; height: 48px;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .module-icon mat-icon { font-size: 24px !important; }

    .module-info { flex: 1; min-width: 0; }
    .module-label { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .module-desc  { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

    .module-arrow { color: var(--text-muted); transition: transform 0.2s; }
    .module-card:hover .module-arrow { transform: translateX(4px); color: var(--accent-primary); }

    .home-footer {
      text-align: center;
      padding: 32px 0 16px;
      font-size: 12px;
      color: var(--text-muted);
    }

    @media (max-width: 600px) { .modules-grid { grid-template-columns: 1fr; } }
  `]
})
export class HomeComponent {
  today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  time  = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  modules: Module[] = [
    { path: '/dashboard',        label: 'Dashboard',        icon: 'dashboard',        color: '#6366f1', desc: 'Revenue, profit & analytics overview' },
    { path: '/transactions',     label: 'Transactions',     icon: 'receipt_long',     color: '#10b981', desc: 'Add and track all cafe services' },
    { path: '/expenses',         label: 'Expenses',         icon: 'shopping_cart',    color: '#f59e0b', desc: 'Track ink, paper & business costs' },
    { path: '/printers',         label: 'Printers',         icon: 'print',            color: '#3b82f6', desc: 'Printer management & analytics' },
    { path: '/bank-accounts',    label: 'Bank Accounts',    icon: 'account_balance',  color: '#8b5cf6', desc: 'Track balances & transactions' },
    { path: '/pan-applications', label: 'PAN Applications', icon: 'badge',            color: '#ec4899', desc: 'PAN card tracking & status' },
    { path: '/cash-register',    label: 'Cash Register',    icon: 'point_of_sale',    color: '#f97316', desc: 'Daily cash tracking & closing' },
    { path: '/analytics',        label: 'Analytics',        icon: 'insights',         color: '#06b6d4', desc: 'Compare service profitability' },
    { path: '/reports',          label: 'Reports',          icon: 'bar_chart',        color: '#14b8a6', desc: 'Export Excel reports & summaries' },
  ];
}
