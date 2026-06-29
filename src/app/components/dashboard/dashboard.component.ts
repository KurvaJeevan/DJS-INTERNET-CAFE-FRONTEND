import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, DatePipe, TitleCasePipe, DecimalPipe],
  template: `
    <div *ngIf="loading" class="flex-center" style="height:60vh">
      <mat-spinner diameter="48"></mat-spinner>
    </div>

    <div *ngIf="!loading">
      <div class="page-header">
        <div>
          <div class="page-title">Dashboard</div>
          <div class="page-subtitle">{{ today }}</div>
        </div>
        <button class="btn-outline" style="padding:8px 16px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13px;background:transparent;color:var(--text-primary)" (click)="load()">
          <mat-icon style="font-size:16px!important;width:16px;height:16px">refresh</mat-icon> Refresh
        </button>
      </div>

      <!-- TODAY STATS — no Revenue -->
      <p class="section-title"><mat-icon>today</mat-icon> Today's Summary</p>
      <div class="grid-3 mb-24">
        <div class="stat-card" [class.success]="todayProfit>=0" [class.danger]="todayProfit<0">
          <mat-icon class="stat-icon">account_balance_wallet</mat-icon>
          <div class="stat-label">Today's Profit</div>
          <div class="stat-value" [class.amount-positive]="todayProfit>=0" [class.amount-negative]="todayProfit<0">
            ₹{{ fmt(todayProfit) }}
          </div>
          <div class="stat-sub">{{ data?.today?.transactions || 0 }} transactions today</div>
        </div>
        <div class="stat-card danger">
          <mat-icon class="stat-icon">remove_circle</mat-icon>
          <div class="stat-label">Today's Expenses</div>
          <div class="stat-value amount-negative">₹{{ fmt(data?.today?.expenses) }}</div>
          <div class="stat-sub">Business costs</div>
        </div>
        <div class="stat-card info">
          <mat-icon class="stat-icon">badge</mat-icon>
          <div class="stat-label">Pending PAN</div>
          <div class="stat-value">{{ data?.pendingPanApplications || 0 }}</div>
          <div class="stat-sub">Needs follow-up</div>
        </div>
      </div>

      <!-- MONTH STATS — no Revenue -->
      <p class="section-title"><mat-icon>calendar_month</mat-icon> This Month</p>
      <div class="grid-2 mb-24">
        <div class="stat-card" [class.success]="monthProfit>=0" [class.danger]="monthProfit<0">
          <mat-icon class="stat-icon">savings</mat-icon>
          <div class="stat-label">Monthly Profit</div>
          <div class="stat-value" [class.amount-positive]="monthProfit>=0" [class.amount-negative]="monthProfit<0">
            ₹{{ fmt(monthProfit) }}
          </div>
          <div class="stat-sub">{{ data?.month?.transactions || 0 }} transactions</div>
        </div>
        <div class="stat-card danger">
          <mat-icon class="stat-icon">remove_circle</mat-icon>
          <div class="stat-label">Monthly Expenses</div>
          <div class="stat-value amount-negative">₹{{ fmt(data?.month?.expenses) }}</div>
          <div class="stat-sub">Total business costs</div>
        </div>
      </div>

      <!-- SERVICE & PRINTER ANALYTICS -->
      <div class="grid-2">
        <!-- Service Profit Breakdown -->
        <div class="djs-card">
          <p class="section-title"><mat-icon>pie_chart</mat-icon> Profit by Service (This Month)</p>
          <div *ngIf="!data?.serviceStats?.length" class="empty-state">
            <mat-icon>bar_chart</mat-icon><p>No data this month</p>
          </div>
          <div *ngFor="let s of data?.serviceStats; let i = index" class="service-row">
            <div class="service-rank" [class.top]="i===0">{{ i+1 }}</div>
            <div class="service-info">
              <div class="service-name">{{ serviceLabel(s._id) }}</div>
              <div class="service-bar-wrap">
                <div class="service-bar"
                     [style.width.%]="barPct(s.totalProfit, maxServiceProfit)"
                     [class.positive]="s.totalProfit>=0"
                     [class.negative]="s.totalProfit<0"></div>
              </div>
            </div>
            <div class="service-profit"
                 [class.amount-positive]="s.totalProfit>=0"
                 [class.amount-negative]="s.totalProfit<0">
              ₹{{ fmt(s.totalProfit) }}
            </div>
            <div class="service-count text-muted fs-12">{{ s.count }}×</div>
          </div>
        </div>

        <!-- Printer Profit Breakdown -->
        <div class="djs-card">
          <p class="section-title"><mat-icon>print</mat-icon> Printer Performance (This Month)</p>
          <div *ngIf="!data?.printerStats?.length" class="empty-state">
            <mat-icon>print_disabled</mat-icon><p>No printer data</p>
          </div>
          <div *ngFor="let p of data?.printerStats; let i = index" class="service-row">
            <div class="service-rank" [class.top]="i===0">
              <mat-icon style="font-size:14px!important">print</mat-icon>
            </div>
            <div class="service-info">
              <div class="service-name">{{ p.printerName || 'Unknown' }}</div>
              <div class="service-bar-wrap">
                <div class="service-bar"
                     [style.width.%]="barPct(p.profit, maxPrinterProfit)"
                     [class.positive]="p.profit>=0"
                     [class.negative]="p.profit<0"></div>
              </div>
            </div>
            <div class="service-profit"
                 [class.amount-positive]="p.profit>=0"
                 [class.amount-negative]="p.profit<0">
              ₹{{ fmt(p.profit) }}
            </div>
          </div>
          <div *ngIf="data?.printerStats?.length" class="printer-highlights mt-16">
            <div class="highlight-row">
              <span class="badge badge-success">Best</span>
              <span>{{ data?.printerStats[0]?.printerName || '—' }}</span>
              <span class="amount-positive" style="margin-left:auto">₹{{ fmt(data?.printerStats[0]?.profit) }}</span>
            </div>
            <div class="highlight-row" *ngIf="data?.printerStats?.length > 1">
              <span class="badge badge-danger">Lowest</span>
              <span>{{ data?.printerStats[data?.printerStats?.length-1]?.printerName || '—' }}</span>
              <span style="margin-left:auto"
                    [class.amount-positive]="data?.printerStats[data?.printerStats?.length-1]?.profit>=0"
                    [class.amount-negative]="data?.printerStats[data?.printerStats?.length-1]?.profit<0">
                ₹{{ fmt(data?.printerStats[data?.printerStats?.length-1]?.profit) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- RECENT TRANSACTIONS -->
      <div class="djs-card mt-24">
        <p class="section-title"><mat-icon>receipt_long</mat-icon> Recent Transactions</p>
        <div *ngIf="!data?.recentTransactions?.length" class="empty-state">
          <mat-icon>receipt</mat-icon><p>No transactions yet</p>
        </div>
        <div class="recent-list">
          <div *ngFor="let t of data?.recentTransactions" class="recent-row">
            <div class="recent-icon"
                 [style.background]="serviceColor(t.serviceType)+'22'"
                 [style.color]="serviceColor(t.serviceType)">
              <mat-icon>{{ serviceIcon(t.serviceType) }}</mat-icon>
            </div>
            <div class="recent-info">
              <div class="recent-service">{{ serviceLabel(t.serviceType) }}</div>
              <div class="recent-meta">
                {{ t.customerName || 'Walk-in' }} &nbsp;·&nbsp;
                {{ t.paymentMethod | titlecase }}
                <span *ngIf="t.bankAccountName"> ({{ t.bankAccountName }})</span>
              </div>
            </div>
            <div class="recent-date">{{ t.date | date:'dd MMM, h:mm a' }}</div>
            <div class="recent-profit"
                 [class.amount-positive]="t.profit>=0"
                 [class.amount-negative]="t.profit<0">
              ₹{{ fmt(t.profit) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .service-row { display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border); }
    .service-row:last-child { border-bottom:none; }
    .service-rank { width:22px;height:22px;border-radius:50%;background:var(--bg-surface);color:var(--text-muted);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0; }
    .service-rank.top { background:rgba(99,102,241,0.2);color:var(--accent-primary); }
    .service-info { flex:1;min-width:0; }
    .service-name { font-size:13px;font-weight:500;color:var(--text-primary);margin-bottom:4px; }
    .service-bar-wrap { height:4px;background:var(--bg-surface);border-radius:2px;overflow:hidden; }
    .service-bar { height:100%;border-radius:2px;transition:width 0.5s ease;min-width:4px; }
    .service-bar.positive { background:var(--accent-success); }
    .service-bar.negative { background:var(--accent-danger); }
    .service-profit { font-size:13px;font-weight:600;flex-shrink:0;width:76px;text-align:right; }
    .service-count  { flex-shrink:0;width:28px;text-align:right; }

    .printer-highlights { display:flex;flex-direction:column;gap:8px; }
    .highlight-row { display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary); }

    .recent-list { display:flex;flex-direction:column;gap:2px; }
    .recent-row { display:flex;align-items:center;gap:12px;padding:10px 8px;border-radius:var(--radius-sm);transition:background 0.15s; }
    .recent-row:hover { background:var(--bg-card-hover); }
    .recent-icon { width:36px;height:36px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .recent-icon mat-icon { font-size:18px!important; }
    .recent-info { flex:1;min-width:0; }
    .recent-service { font-size:13px;font-weight:500;color:var(--text-primary); }
    .recent-meta    { font-size:11px;color:var(--text-muted); }
    .recent-date    { font-size:11px;color:var(--text-muted);flex-shrink:0; }
    .recent-profit  { font-size:14px;font-weight:600;flex-shrink:0;min-width:70px;text-align:right; }
  `]
})
export class DashboardComponent implements OnInit {
  loading = true;
  data: any = null;
  today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getDashboardSummary().subscribe({
      next: r => { this.data = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  get todayProfit()  { return (this.data?.today?.profit  || 0); }
  get monthProfit()  { return (this.data?.month?.profit  || 0); }

  get maxServiceProfit() { return Math.max(1, ...((this.data?.serviceStats||[]).map((s:any)=>Math.abs(s.totalProfit||0)))); }
  get maxPrinterProfit() { return Math.max(1, ...((this.data?.printerStats||[]).map((p:any)=>Math.abs(p.profit||0)))); }
  barPct(val: number, max: number) { return Math.round((Math.abs(val||0)/max)*100); }

  fmt(n: any) { return Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:0, maximumFractionDigits:2 }); }

  serviceLabel(type: string) {
    const m: any = { printing:'Printing',xerox:'Xerox',scanning:'Scanning',photocopy:'Photocopy',
      online_application:'Online Application',spiral_binding:'Spiral Binding',pvc_card:'PVC Card',
      lamination:'Lamination',money_transfer:'Money Transfer',aeps:'AEPS',cash_for_online:'Cash for Online Payment',pan_service:'PAN Service',electricity_bill:'Electricity Bill',other:'Other' };
    return m[type]||type;
  }
  serviceIcon(type: string) {
    const m: any = { printing:'print',xerox:'content_copy',scanning:'scanner',photocopy:'photo_copy',
      online_application:'computer',spiral_binding:'book',pvc_card:'credit_card',lamination:'layers',
      money_transfer:'swap_horiz',aeps:'point_of_sale',cash_for_online:'currency_exchange',pan_service:'badge',electricity_bill:'bolt',other:'miscellaneous_services' };
    return m[type]||'receipt';
  }
  serviceColor(type: string) {
    const m: any = { printing:'#6366f1',xerox:'#3b82f6',scanning:'#10b981',photocopy:'#f59e0b',
      online_application:'#8b5cf6',spiral_binding:'#ec4899',pvc_card:'#14b8a6',lamination:'#f97316',
      money_transfer:'#06b6d4',aeps:'#84cc16',cash_for_online:'#0ea5e9',pan_service:'#a855f7',electricity_bill:'#eab308',other:'#94a3b8' };
    return m[type]||'#94a3b8';
  }
}
