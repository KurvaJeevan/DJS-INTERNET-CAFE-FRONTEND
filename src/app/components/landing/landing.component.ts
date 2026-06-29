import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from '../../services/theme.service';

interface Feature {
  icon: string;
  title: string;
  desc: string;
  color: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule],
  template: `
    <div class="landing">
      <!-- TOP NAV -->
      <header class="landing-nav">
        <div class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="url(#lg1)"/>
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
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
          <span class="brand-name">DJS Internet Cafe</span>
        </div>
        <div class="nav-actions">
          <button class="theme-toggle" (click)="theme.toggle()" [attr.aria-label]="'Switch theme'">
            <mat-icon>{{ theme.mode() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
          <button mat-flat-button class="btn-primary" routerLink="/login">
            Sign In <mat-icon style="margin-left:4px;font-size:18px!important">arrow_forward</mat-icon>
          </button>
        </div>
      </header>

      <!-- HERO -->
      <section class="hero">
        <div class="hero-badge">
          <mat-icon>storefront</mat-icon> Business Management System
        </div>
        <h1 class="hero-title">
          Run your internet cafe<br>
          <span class="gradient-text">without the guesswork.</span>
        </h1>
        <p class="hero-subtitle">
          Track every transaction, printer, bank account, and PAN application in one place.
          Built specifically for internet cafes, Xerox centers, and digital seva kendras.
        </p>
        <div class="hero-actions">
          <button mat-flat-button class="btn-primary btn-large" routerLink="/login">
            <mat-icon>login</mat-icon> Get Started
          </button>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="features">
        <h2 class="section-heading">Everything your cafe needs</h2>
        <p class="section-sub">One dashboard for daily operations, money tracking, and reporting</p>

        <div class="features-grid">
          <div *ngFor="let f of features" class="feature-card">
            <div class="feature-icon" [style.background]="f.color+'1a'" [style.color]="f.color">
              <mat-icon>{{ f.icon }}</mat-icon>
            </div>
            <div class="feature-title">{{ f.title }}</div>
            <div class="feature-desc">{{ f.desc }}</div>
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section class="how-it-works">
        <h2 class="section-heading">Built around how cafes actually work</h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-title">Log every sale as it happens</div>
            <div class="step-desc">Printing, Xerox, AEPS, money transfer, PAN services — one quick form per transaction.</div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-title">Money flows to the right place automatically</div>
            <div class="step-desc">Cash goes to your cash register, online payments go to the right bank account — no manual reconciliation.</div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-title">See what's actually profitable</div>
            <div class="step-desc">Compare services side by side, spot your best printer, and export clean Excel reports anytime.</div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-section">
        <div class="cta-box">
          <h2>Ready to get organized?</h2>
          <p>Sign in to your dashboard and pick up right where you left off.</p>
          <button mat-flat-button class="btn-primary btn-large" routerLink="/login">
            <mat-icon>login</mat-icon> Sign In to Continue
          </button>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="landing-footer">
        <p>DJS Internet Cafe Management System</p>
      </footer>
    </div>
  `,
  styles: [`
    .landing {
      min-height: 100vh;
      background: var(--bg-base);
      color: var(--text-primary);
      overflow-x: hidden;
    }

    /* NAV */
    .landing-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 40px;
      border-bottom: 1px solid var(--border);
      position: sticky; top: 0; z-index: 10;
      background: var(--bg-base);
      backdrop-filter: blur(8px);
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon { width: 36px; height: 36px; filter: drop-shadow(0 0 8px rgba(99,102,241,0.4)); }
    .brand-icon svg { width: 100%; height: 100%; }
    .brand-name { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
    .nav-actions { display: flex; align-items: center; gap: 12px; }

    /* HERO */
    .hero {
      max-width: 760px; margin: 0 auto;
      text-align: center;
      padding: 100px 24px 80px;
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 99px;
      background: var(--accent-glow); color: var(--accent-primary);
      font-size: 12px; font-weight: 600; margin-bottom: 24px;
    }
    .hero-badge mat-icon { font-size: 16px !important; width: 16px; height: 16px; }
    .hero-title {
      font-size: 48px; font-weight: 800; line-height: 1.15;
      letter-spacing: -0.02em; margin-bottom: 20px;
    }
    .gradient-text {
      background: linear-gradient(90deg, var(--accent-primary), #8b5cf6);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .hero-subtitle {
      font-size: 17px; color: var(--text-secondary); line-height: 1.6;
      max-width: 560px; margin: 0 auto 36px;
    }
    .hero-actions { display: flex; justify-content: center; gap: 16px; }
    .btn-large { padding: 0 28px !important; height: 50px !important; font-size: 15px !important; }

    /* FEATURES */
    .features { max-width: 1100px; margin: 0 auto; padding: 60px 24px; }
    .section-heading { font-size: 30px; font-weight: 700; text-align: center; letter-spacing: -0.01em; }
    .section-sub { text-align: center; color: var(--text-secondary); margin-top: 8px; margin-bottom: 48px; font-size: 15px; }

    .features-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
    }
    .feature-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 24px;
      transition: all 0.2s;
    }
    .feature-card:hover { border-color: var(--border-hover); transform: translateY(-3px); box-shadow: var(--shadow-card); }
    .feature-icon {
      width: 44px; height: 44px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px;
    }
    .feature-icon mat-icon { font-size: 22px !important; }
    .feature-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
    .feature-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

    /* HOW IT WORKS */
    .how-it-works {
      max-width: 1000px; margin: 0 auto; padding: 60px 24px 80px;
    }
    .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 48px; }
    .step { text-align: left; }
    .step-number {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--accent-glow); color: var(--accent-primary);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px; margin-bottom: 16px;
    }
    .step-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
    .step-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

    /* CTA */
    .cta-section { padding: 40px 24px 100px; }
    .cta-box {
      max-width: 680px; margin: 0 auto; text-align: center;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-xl); padding: 56px 40px;
    }
    .cta-box h2 { font-size: 26px; font-weight: 700; margin-bottom: 10px; }
    .cta-box p { color: var(--text-secondary); margin-bottom: 28px; font-size: 14px; }

    /* FOOTER */
    .landing-footer {
      text-align: center; padding: 28px 24px;
      border-top: 1px solid var(--border);
      color: var(--text-muted); font-size: 12px;
    }

    @media (max-width: 900px) {
      .features-grid, .steps { grid-template-columns: 1fr; }
      .hero-title { font-size: 36px; }
    }
    @media (max-width: 600px) {
      .landing-nav { padding: 16px 20px; }
      .hero { padding: 64px 20px 56px; }
    }
  `]
})
export class LandingComponent {
  constructor(public theme: ThemeService) {}

  features: Feature[] = [
    { icon: 'receipt_long',    title: 'Transactions',     desc: 'Printing, Xerox, AEPS, money transfer, PAN services — logged in one quick form.', color: '#6366f1' },
    { icon: 'account_balance', title: 'Bank Accounts',    desc: 'Track multiple accounts, auto-credit online payments, keep personal & business separate.', color: '#8b5cf6' },
    { icon: 'point_of_sale',   title: 'Cash Register',    desc: 'Daily opening/closing cash counts with automatic variance detection.', color: '#f97316' },
    { icon: 'print',           title: 'Printer Analytics', desc: 'See revenue and profit per printer — know which machine actually earns.', color: '#3b82f6' },
    { icon: 'badge',           title: 'PAN Applications', desc: 'Upload the acknowledgement PDF and auto-extract applicant details — fully offline.', color: '#ec4899' },
    { icon: 'insights',        title: 'Profitability Analytics', desc: 'Rank every service by profit margin and spot your top earners instantly.', color: '#06b6d4' },
  ];
}
