import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DecimalPipe,
    MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Analytics</div>
        <div class="page-subtitle">Compare service profitability and spot your biggest earners</div>
      </div>
    </div>

    <!-- DATE FILTER -->
    <div class="djs-card mb-24">
      <div class="filter-row">
        <div class="quick-filters">
          <button mat-stroked-button class="btn-outline" (click)="setThisWeek()">This Week</button>
          <button mat-stroked-button class="btn-outline" (click)="setThisMonth()">This Month</button>
          <button mat-stroked-button class="btn-outline" (click)="setLastMonth()">Last Month</button>
          <button mat-stroked-button class="btn-outline" (click)="setAllTime()">All Time</button>
        </div>
        <div class="custom-range">
          <mat-form-field appearance="outline" style="max-width:160px">
            <mat-label>From</mat-label>
            <input matInput type="date" [(ngModel)]="startDate">
          </mat-form-field>
          <mat-form-field appearance="outline" style="max-width:160px">
            <mat-label>To</mat-label>
            <input matInput type="date" [(ngModel)]="endDate">
          </mat-form-field>
          <button mat-flat-button class="btn-primary" (click)="load()">
            <mat-icon>refresh</mat-icon> Load
          </button>
        </div>
      </div>
    </div>

    <div *ngIf="loading" class="flex-center" style="height:200px"><mat-spinner diameter="40"></mat-spinner></div>

    <div *ngIf="!loading && loaded">
      <!-- TOP SUMMARY -->
      <div class="grid-3 mb-24">
        <div class="stat-card success">
          <mat-icon class="stat-icon">trending_up</mat-icon>
          <div class="stat-label">Total Profit</div>
          <div class="stat-value amount-positive">₹{{ totals.totalProfit | number:'1.0-0' }}</div>
          <div class="stat-sub">{{ totals.count || 0 }} transactions</div>
        </div>
        <div class="stat-card info">
          <mat-icon class="stat-icon">star</mat-icon>
          <div class="stat-label">Most Profitable Service</div>
          <div class="stat-value" style="font-size:18px">{{ topService ? svcLabel(topService._id) : '—' }}</div>
          <div class="stat-sub amount-positive" *ngIf="topService">₹{{ topService.totalProfit | number:'1.0-0' }} earned</div>
        </div>
        <div class="stat-card danger">
          <mat-icon class="stat-icon">trending_down</mat-icon>
          <div class="stat-label">Least Profitable Service</div>
          <div class="stat-value" style="font-size:18px">{{ bottomService ? svcLabel(bottomService._id) : '—' }}</div>
          <div class="stat-sub" [class.amount-positive]="(bottomService?.totalProfit||0)>=0" [class.amount-negative]="(bottomService?.totalProfit||0)<0" *ngIf="bottomService">
            ₹{{ bottomService.totalProfit | number:'1.0-0' }} earned
          </div>
        </div>
      </div>

      <!-- RANKED SERVICE LIST -->
      <div class="djs-card mb-24">
        <p class="section-title"><mat-icon>leaderboard</mat-icon> Service Profitability Ranking</p>
        <div *ngIf="!byService.length" class="empty-state">
          <mat-icon>bar_chart</mat-icon><p>No data for this period</p>
        </div>

        <div class="ranking-list">
          <div *ngFor="let s of byService; let i = index" class="rank-row">
            <div class="rank-badge" [class.gold]="i===0" [class.silver]="i===1" [class.bronze]="i===2">
              {{ i + 1 }}
            </div>
            <div class="rank-info">
              <div class="rank-name">{{ svcLabel(s._id) }}</div>
              <div class="rank-bar-wrap">
                <div class="rank-bar" [style.width.%]="barPct(s.totalProfit)"
                     [class.positive]="s.totalProfit>=0" [class.negative]="s.totalProfit<0"></div>
              </div>
              <div class="rank-meta">
                {{ s.count }} transactions
                <span *ngIf="s.marginPct !== null"> · {{ s.marginPct }}% margin</span>
                · Avg ₹{{ s.avgProfit | number:'1.0-0' }}/txn
              </div>
            </div>
            <div class="rank-numbers">
              <div class="rank-profit" [class.amount-positive]="s.totalProfit>=0" [class.amount-negative]="s.totalProfit<0">
                ₹{{ s.totalProfit | number:'1.0-0' }}
              </div>
              <div class="rank-payment-split">
                <span class="mini-badge cash">{{ s.cashCount }} cash</span>
                <span class="mini-badge online">{{ s.onlineCount }} online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- INSIGHTS -->
      <div class="djs-card">
        <p class="section-title"><mat-icon>lightbulb</mat-icon> Quick Insights</p>
        <div class="insights-grid">
          <div class="insight-item" *ngIf="topService">
            <mat-icon style="color:var(--accent-success)">emoji_events</mat-icon>
            <div>
              <strong>{{ svcLabel(topService._id) }}</strong> is your top earner —
              contributing <strong class="amount-positive">{{ topSharePct }}%</strong> of total profit
              across {{ topService.count }} transactions.
            </div>
          </div>
          <div class="insight-item" *ngIf="highestMargin">
            <mat-icon style="color:var(--accent-info)">percent</mat-icon>
            <div>
              <strong>{{ svcLabel(highestMargin._id) }}</strong> has your best profit margin at
              <strong class="amount-positive">{{ highestMargin.marginPct }}%</strong> —
              consider promoting this service more.
            </div>
          </div>
          <div class="insight-item" *ngIf="lowVolumeHighProfit">
            <mat-icon style="color:var(--accent-warn)">trending_up</mat-icon>
            <div>
              <strong>{{ svcLabel(lowVolumeHighProfit._id) }}</strong> earns
              <strong class="amount-positive">₹{{ lowVolumeHighProfit.avgProfit | number:'1.0-0' }}</strong> per transaction
              on average — your highest per-job profit.
            </div>
          </div>
          <div class="insight-item" *ngIf="bottomService && bottomService.totalProfit < 0">
            <mat-icon style="color:var(--accent-danger)">warning</mat-icon>
            <div>
              <strong>{{ svcLabel(bottomService._id) }}</strong> is currently running at a loss of
              <strong class="amount-negative">₹{{ bottomService.totalProfit | number:'1.0-0' }}</strong> — worth reviewing pricing or costs.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-row { display:flex;flex-direction:column;gap:16px; }
    .quick-filters { display:flex;gap:8px;flex-wrap:wrap; }
    .custom-range { display:flex;gap:12px;align-items:center;flex-wrap:wrap; }

    .ranking-list { display:flex;flex-direction:column;gap:4px; }
    .rank-row { display:flex;align-items:center;gap:14px;padding:14px 8px;border-bottom:1px solid var(--border); }
    .rank-row:last-child { border-bottom:none; }

    .rank-badge {
      width:32px;height:32px;border-radius:50%;background:var(--bg-surface);color:var(--text-muted);
      display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;
    }
    .rank-badge.gold   { background:rgba(234,179,8,0.2);  color:#eab308; }
    .rank-badge.silver { background:rgba(148,163,184,0.2);color:#94a3b8; }
    .rank-badge.bronze { background:rgba(217,119,6,0.2);  color:#d97706; }

    .rank-info { flex:1;min-width:0; }
    .rank-name { font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:6px; }
    .rank-bar-wrap { height:6px;background:var(--bg-surface);border-radius:3px;overflow:hidden;margin-bottom:6px; }
    .rank-bar { height:100%;border-radius:3px;transition:width 0.6s ease;min-width:4px; }
    .rank-bar.positive { background:linear-gradient(90deg, var(--accent-primary), var(--accent-success)); }
    .rank-bar.negative { background:var(--accent-danger); }
    .rank-meta { font-size:11px;color:var(--text-muted); }

    .rank-numbers { text-align:right;flex-shrink:0; }
    .rank-profit { font-size:16px;font-weight:700;margin-bottom:4px; }
    .rank-payment-split { display:flex;gap:4px;justify-content:flex-end; }
    .mini-badge { font-size:10px;padding:2px 6px;border-radius:99px;font-weight:600; }
    .mini-badge.cash   { background:rgba(245,158,11,0.15);color:var(--accent-warn); }
    .mini-badge.online { background:rgba(59,130,246,0.15);color:var(--accent-info); }

    .insights-grid { display:flex;flex-direction:column;gap:14px; }
    .insight-item { display:flex;align-items:flex-start;gap:12px;font-size:13px;color:var(--text-secondary);line-height:1.5; }
    .insight-item mat-icon { flex-shrink:0;margin-top:1px; }
  `]
})
export class AnalyticsComponent implements OnInit {
  startDate = '';
  endDate   = '';
  loading   = false;
  loaded    = false;
  byService: any[] = [];
  totals: any = {};

  constructor(private api: ApiService) {}

  ngOnInit() { this.setThisMonth(); }

  get topService()    { return this.byService.length ? this.byService[0] : null; }
  get bottomService()  { return this.byService.length ? this.byService[this.byService.length - 1] : null; }
  get topSharePct() {
    if (!this.topService || !this.totals.totalProfit) return 0;
    return Math.round((this.topService.totalProfit / this.totals.totalProfit) * 100);
  }
  get highestMargin() {
    const withMargin = this.byService.filter(s => s.marginPct !== null);
    if (!withMargin.length) return null;
    return withMargin.reduce((a, b) => (b.marginPct > a.marginPct ? b : a));
  }
  get lowVolumeHighProfit() {
    if (!this.byService.length) return null;
    return this.byService.reduce((a, b) => (b.avgProfit > a.avgProfit ? b : a));
  }
  get maxAbsProfit() {
    return Math.max(1, ...this.byService.map(s => Math.abs(s.totalProfit || 0)));
  }
  barPct(val: number) { return Math.round((Math.abs(val || 0) / this.maxAbsProfit) * 100); }

  setThisWeek()  { const n=new Date(); const d=n.getDay(); const s=new Date(n); s.setDate(n.getDate()-d); this.startDate=this.iso(s); this.endDate=this.iso(n); this.load(); }
  setThisMonth() { const n=new Date(); this.startDate=this.iso(new Date(n.getFullYear(),n.getMonth(),1)); this.endDate=this.iso(n); this.load(); }
  setLastMonth() { const n=new Date(); const f=new Date(n.getFullYear(),n.getMonth()-1,1); const l=new Date(n.getFullYear(),n.getMonth(),0); this.startDate=this.iso(f); this.endDate=this.iso(l); this.load(); }
  setAllTime()   { this.startDate=''; this.endDate=''; this.load(); }
  iso(d: Date)   { return d.toISOString().split('T')[0]; }

  load() {
    this.loading = true;
    const params: any = {};
    if (this.startDate) params.startDate = this.startDate;
    if (this.endDate)   params.endDate   = this.endDate;
    this.api.getServiceAnalytics(params).subscribe({
      next: (res) => {
        this.byService = res.data?.byService || [];
        this.totals    = res.data?.totals || {};
        this.loading = false;
        this.loaded  = true;
      },
      error: () => { this.loading = false; }
    });
  }

  svcLabel(type: string) {
    const m: any = {
      printing:'Printing', xerox:'Xerox', scanning:'Scanning', photocopy:'Photocopy',
      online_application:'Online Application', spiral_binding:'Spiral Binding', pvc_card:'PVC Card',
      lamination:'Lamination', money_transfer:'Money Transfer', aeps:'AEPS',
      pan_service:'PAN Service', cash_for_online:'Cash for Online Payment', electricity_bill:'Electricity Bill', other:'Other'
    };
    return m[type] || type;
  }
}
