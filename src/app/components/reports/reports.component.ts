import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { TitleCasePipe, DecimalPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';

declare var XLSX: any;

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatTableModule, MatTabsModule,
    TitleCasePipe, DecimalPipe, DatePipe
  ],
  template: `
    <div class="page-header">
      <div><div class="page-title">Reports</div><div class="page-subtitle">Generate and export business reports</div></div>
    </div>

    <!-- DATE FILTER -->
    <div class="djs-card mb-24">
      <p class="section-title"><mat-icon>date_range</mat-icon> Date Range</p>
      <div class="filter-row">
        <div class="quick-filters">
          <button mat-stroked-button class="btn-outline" (click)="setToday()">Today</button>
          <button mat-stroked-button class="btn-outline" (click)="setThisWeek()">This Week</button>
          <button mat-stroked-button class="btn-outline" (click)="setThisMonth()">This Month</button>
          <button mat-stroked-button class="btn-outline" (click)="setLastMonth()">Last Month</button>
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
          <button mat-flat-button class="btn-primary" (click)="loadAll()" [disabled]="loading">
            <mat-icon>refresh</mat-icon> Load Reports
          </button>
        </div>
      </div>
    </div>

    <div *ngIf="loading" class="flex-center" style="height:120px"><mat-spinner diameter="40"></mat-spinner></div>

    <mat-tab-group *ngIf="!loading && loaded" class="reports-tabs">

      <!-- ── TRANSACTIONS TAB ── -->
      <mat-tab label="Transactions">
        <div class="tab-content">
          <div class="report-header">
            <div class="report-summary">
              <div class="report-stat">
                <div class="rs-label">Total Revenue</div>
                <div class="rs-value amount-positive">₹{{ txSummary.revenue | number:'1.0-0' }}</div>
              </div>
              <div class="report-stat">
                <div class="rs-label">Total Profit</div>
                <div class="rs-value" [class.amount-positive]="txSummary.profit>=0" [class.amount-negative]="txSummary.profit<0">
                  ₹{{ txSummary.profit | number:'1.0-0' }}
                </div>
              </div>
              <div class="report-stat">
                <div class="rs-label">Transactions</div>
                <div class="rs-value">{{ transactions.length }}</div>
              </div>
            </div>
            <button mat-flat-button class="btn-success" (click)="exportTransactions()">
              <mat-icon>download</mat-icon> Export Excel
            </button>
          </div>
          <div class="table-container">
            <table mat-table [dataSource]="transactions.slice(0,100)">
              <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let t">{{ t.date | date:'dd/MM/yy' }}</td></ng-container>
              <ng-container matColumnDef="service"><th mat-header-cell *matHeaderCellDef>Service</th><td mat-cell *matCellDef="let t"><span class="badge badge-primary">{{ svcLabel(t.serviceType) }}</span></td></ng-container>
              <ng-container matColumnDef="customer"><th mat-header-cell *matHeaderCellDef>Customer</th><td mat-cell *matCellDef="let t">{{ t.customerName || '—' }}</td></ng-container>
              <ng-container matColumnDef="payment"><th mat-header-cell *matHeaderCellDef>Payment</th><td mat-cell *matCellDef="let t"><span class="badge badge-default">{{ t.paymentMethod | titlecase }}</span></td></ng-container>
              <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let t" class="amount-positive">₹{{ t.amount | number:'1.0-2' }}</td></ng-container>
              <ng-container matColumnDef="profit"><th mat-header-cell *matHeaderCellDef>Profit</th><td mat-cell *matCellDef="let t" [class.amount-positive]="t.profit>=0" [class.amount-negative]="t.profit<0">₹{{ t.profit | number:'1.0-2' }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="txCols"></tr>
              <tr mat-row *matRowDef="let r; columns: txCols;"></tr>
            </table>
          </div>
          <p class="text-muted fs-12 mt-16" *ngIf="transactions.length>100">Showing first 100 of {{ transactions.length }}. Export to see all.</p>
        </div>
      </mat-tab>

      <!-- ── EXPENSES TAB ── -->
      <mat-tab label="Expenses">
        <div class="tab-content">
          <div class="report-header">
            <div class="report-summary">
              <div class="report-stat">
                <div class="rs-label">Total Expenses</div>
                <div class="rs-value amount-negative">₹{{ expSummary | number:'1.0-0' }}</div>
              </div>
              <div class="report-stat">
                <div class="rs-label">No. of Entries</div>
                <div class="rs-value">{{ expenses.length }}</div>
              </div>
            </div>
            <button mat-flat-button class="btn-success" (click)="exportExpenses()">
              <mat-icon>download</mat-icon> Export Excel
            </button>
          </div>
          <div class="table-container">
            <table mat-table [dataSource]="expenses">
              <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let e">{{ e.date | date:'dd/MM/yy' }}</td></ng-container>
              <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Expense</th><td mat-cell *matCellDef="let e">{{ e.name }}</td></ng-container>
              <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef>Category</th><td mat-cell *matCellDef="let e"><span class="badge badge-warn">{{ e.category | titlecase }}</span></td></ng-container>
              <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let e" class="amount-negative">₹{{ e.amount | number:'1.0-2' }}</td></ng-container>
              <ng-container matColumnDef="notes"><th mat-header-cell *matHeaderCellDef>Notes</th><td mat-cell *matCellDef="let e" class="text-muted">{{ e.notes || '—' }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="expCols"></tr>
              <tr mat-row *matRowDef="let r; columns: expCols;"></tr>
            </table>
          </div>
        </div>
      </mat-tab>

      <!-- ── PROFIT TAB ── -->
      <mat-tab label="Profit Analysis">
        <div class="tab-content">
          <div class="report-header">
            <div class="report-summary">
              <div class="report-stat">
                <div class="rs-label">Gross Revenue</div>
                <div class="rs-value amount-positive">₹{{ txSummary.revenue | number:'1.0-0' }}</div>
              </div>
              <div class="report-stat">
                <div class="rs-label">Total Expenses</div>
                <div class="rs-value amount-negative">₹{{ expSummary | number:'1.0-0' }}</div>
              </div>
              <div class="report-stat">
                <div class="rs-label">Net Profit</div>
                <div class="rs-value" [class.amount-positive]="netProfit>=0" [class.amount-negative]="netProfit<0">
                  ₹{{ netProfit | number:'1.0-0' }}
                </div>
              </div>
            </div>
            <button mat-flat-button class="btn-success" (click)="exportProfit()">
              <mat-icon>download</mat-icon> Export Excel
            </button>
          </div>
          <!-- Service breakdown -->
          <div class="breakdown-grid">
            <div *ngFor="let s of serviceBreakdown" class="breakdown-card djs-card">
              <div class="bc-label">{{ svcLabel(s._id) }}</div>
              <div class="bc-revenue amount-positive">₹{{ s.revenue | number:'1.0-0' }}</div>
              <div class="bc-sub text-muted fs-12">{{ s.count }} transactions</div>
              <div class="bc-profit" [class.amount-positive]="s.profit>=0" [class.amount-negative]="s.profit<0">₹{{ s.profit | number:'1.0-0' }} profit</div>
            </div>
          </div>
        </div>
      </mat-tab>

      <!-- ── PRINTERS TAB ── -->
      <mat-tab label="Printers">
        <div class="tab-content">
          <div class="report-header">
            <div></div>
            <button mat-flat-button class="btn-success" (click)="exportPrinters()">
              <mat-icon>download</mat-icon> Export Excel
            </button>
          </div>
          <div class="table-container">
            <table mat-table [dataSource]="printerReport">
              <ng-container matColumnDef="printer"><th mat-header-cell *matHeaderCellDef>Printer</th><td mat-cell *matCellDef="let p">{{ p.printerName || 'Unknown' }}</td></ng-container>
              <ng-container matColumnDef="jobs"><th mat-header-cell *matHeaderCellDef>Jobs</th><td mat-cell *matCellDef="let p">{{ p.jobs }}</td></ng-container>
              <ng-container matColumnDef="pages"><th mat-header-cell *matHeaderCellDef>Pages</th><td mat-cell *matCellDef="let p">{{ p.totalPages }}</td></ng-container>
              <ng-container matColumnDef="revenue"><th mat-header-cell *matHeaderCellDef>Revenue</th><td mat-cell *matCellDef="let p" class="amount-positive">₹{{ p.totalRevenue | number:'1.0-0' }}</td></ng-container>
              <ng-container matColumnDef="profit"><th mat-header-cell *matHeaderCellDef>Profit</th><td mat-cell *matCellDef="let p" [class.amount-positive]="p.totalProfit>=0" [class.amount-negative]="p.totalProfit<0">₹{{ p.totalProfit | number:'1.0-0' }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="printerCols"></tr>
              <tr mat-row *matRowDef="let r; columns: printerCols;"></tr>
            </table>
          </div>
        </div>
      </mat-tab>

      <!-- ── PAN TAB ── -->
      <mat-tab label="PAN Applications">
        <div class="tab-content">
          <div class="report-header">
            <div class="report-summary">
              <div class="report-stat"><div class="rs-label">Total Applications</div><div class="rs-value">{{ panReport.length }}</div></div>
              <div class="report-stat"><div class="rs-label">Revenue</div><div class="rs-value amount-positive">₹{{ panRevenue | number:'1.0-0' }}</div></div>
            </div>
            <button mat-flat-button class="btn-success" (click)="exportPan()">
              <mat-icon>download</mat-icon> Export Excel
            </button>
          </div>
          <div class="table-container">
            <table mat-table [dataSource]="panReport">
              <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Applicant</th><td mat-cell *matCellDef="let p">{{ p.applicantName }}</td></ng-container>
              <ng-container matColumnDef="appNo"><th mat-header-cell *matHeaderCellDef>App No.</th><td mat-cell *matCellDef="let p">{{ p.applicationNumber || '—' }}</td></ng-container>
              <ng-container matColumnDef="mobile"><th mat-header-cell *matHeaderCellDef>Mobile</th><td mat-cell *matCellDef="let p">{{ p.mobileNumber || '—' }}</td></ng-container>
              <ng-container matColumnDef="appDate"><th mat-header-cell *matHeaderCellDef>App Date</th><td mat-cell *matCellDef="let p">{{ p.applicationDate || '—' }}</td></ng-container>
              <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>Paid</th><td mat-cell *matCellDef="let p" class="amount-positive">₹{{ p.amountPaid || 0 }}</td></ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let p">
                  <span class="badge" [style.background]="statusColor(p.status)+'22'" [style.color]="statusColor(p.status)">{{ p.status | titlecase }}</span>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="panCols"></tr>
              <tr mat-row *matRowDef="let r; columns: panCols;"></tr>
            </table>
          </div>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .filter-row { display:flex;flex-direction:column;gap:16px; }
    .quick-filters { display:flex;gap:8px;flex-wrap:wrap; }
    .custom-range { display:flex;gap:12px;align-items:center;flex-wrap:wrap; }
    .reports-tabs ::ng-deep .mat-mdc-tab-label-container { background:var(--bg-surface);border-bottom:1px solid var(--border); }
    .tab-content { padding: 24px 0; }
    .report-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px; }
    .report-summary { display:flex;gap:24px;flex-wrap:wrap; }
    .report-stat {}
    .rs-label { font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px; }
    .rs-value { font-size:22px;font-weight:700;color:var(--text-primary); }
    .breakdown-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:16px; }
    .breakdown-card { padding:16px!important; }
    .bc-label { font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:6px; }
    .bc-revenue { font-size:18px;font-weight:700; }
    .bc-profit { font-size:14px;font-weight:600;margin-top:4px; }
  `]
})
export class ReportsComponent implements OnInit {
  startDate = '';
  endDate   = '';
  loading   = false;
  loaded    = false;
  transactions: any[] = [];
  expenses: any[]     = [];
  printerReport: any[]= [];
  panReport: any[]    = [];
  serviceBreakdown: any[] = [];
  txCols      = ['date','service','customer','payment','amount','profit'];
  expCols     = ['date','name','category','amount','notes'];
  printerCols = ['printer','jobs','pages','revenue','profit'];
  panCols     = ['name','appNo','mobile','appDate','amount','status'];

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() { this.setThisMonth(); }

  get txSummary() {
    return {
      revenue: this.transactions.reduce((s,t)=>s+t.amount,0),
      profit:  this.transactions.reduce((s,t)=>s+t.profit,0)
    };
  }
  get expSummary() { return this.expenses.reduce((s,e)=>s+e.amount,0); }
  get netProfit()  { return this.txSummary.profit - this.expSummary; }
  get panRevenue() { return this.panReport.reduce((s,p)=>s+(p.amountPaid||0),0); }

  setToday()     { const t=this.iso(new Date()); this.startDate=t; this.endDate=t; }
  setThisWeek()  { const n=new Date(); const d=n.getDay(); const s=new Date(n); s.setDate(n.getDate()-d); this.startDate=this.iso(s); this.endDate=this.iso(n); }
  setThisMonth() { const n=new Date(); this.startDate=this.iso(new Date(n.getFullYear(),n.getMonth(),1)); this.endDate=this.iso(n); }
  setLastMonth() { const n=new Date(); const f=new Date(n.getFullYear(),n.getMonth()-1,1); const l=new Date(n.getFullYear(),n.getMonth(),0); this.startDate=this.iso(f); this.endDate=this.iso(l); }
  iso(d: Date)   { return d.toISOString().split('T')[0]; }

  loadAll() {
    if (!this.startDate || !this.endDate) { this.snack.open('Select date range','',{duration:3000}); return; }
    this.loading = true;
    const p = { startDate: this.startDate, endDate: this.endDate };
    const calls = [
      this.api.getTransactionReport(p).toPromise(),
      this.api.getExpenseReport(p).toPromise(),
      this.api.getPrinterReport(p).toPromise(),
      this.api.getPanReport(p).toPromise(),
      this.api.getTransactionStats(p).toPromise()
    ];
    Promise.all(calls).then(([tx,exp,pr,pan,stats]: any) => {
      this.transactions   = tx?.data || [];
      this.expenses       = exp?.data || [];
      this.printerReport  = pr?.data || [];
      this.panReport      = pan?.data || [];
      this.serviceBreakdown = stats?.data?.byService || [];
      this.loading = false;
      this.loaded  = true;
    }).catch(() => { this.snack.open('Error loading reports','',{duration:3000,panelClass:'snack-error'}); this.loading=false; });
  }

  exportTransactions() {
    const rows = this.transactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString('en-IN'),
      Time: new Date(t.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      Service: this.svcLabel(t.serviceType),
      Customer: t.customerName || '', Phone: t.customerPhone || '',
      Payment: t.paymentMethod, Amount: t.amount, Profit: t.profit,
      Printer: t.printerName || '', Pages: t.pages || 0, Notes: t.notes || ''
    }));
    this.downloadXlsx(rows, 'Transactions', ['Amount', 'Profit', 'Pages']);
  }

  exportExpenses() {
    const rows = this.expenses.map(e => ({
      Date: new Date(e.date).toLocaleDateString('en-IN'),
      Time: new Date(e.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      Expense: e.name, Category: e.category, Amount: e.amount, Notes: e.notes || ''
    }));
    this.downloadXlsx(rows, 'Expenses', ['Amount']);
  }

  exportProfit() {
    const rows = [{
      'Date From': this.startDate, 'Date To': this.endDate,
      'Gross Revenue': this.txSummary.revenue, 'Total Expenses': this.expSummary,
      'Net Profit': this.netProfit, 'Total Transactions': this.transactions.length
    }];
    const breakdown = this.serviceBreakdown.map(s => ({
      Service: this.svcLabel(s._id), Revenue: s.revenue, Profit: s.profit, Count: s.count
    }));
    this.downloadXlsx([...rows, {}, ...breakdown], 'Profit_Report', ['Revenue', 'Profit', 'Count']);
  }

  exportPrinters() {
    const rows = this.printerReport.map(p => ({
      Printer: p.printerName || 'Unknown', Jobs: p.jobs,
      'Total Pages': p.totalPages, Revenue: p.totalRevenue, Profit: p.totalProfit
    }));
    this.downloadXlsx(rows, 'Printer_Report', ['Jobs', 'Total Pages', 'Revenue', 'Profit']);
  }

  exportPan() {
    const rows = this.panReport.map(p => ({
      Name: p.applicantName, 'App No': p.applicationNumber || '',
      'PAN No': p.panNumber || '', Mobile: p.mobileNumber || '',
      'App Date': p.applicationDate || '', 'Amount Paid': p.amountPaid || 0,
      Status: p.status, Gender: p.gender || '', DOB: p.dateOfBirth || '',
      Father: p.fatherName || '', Aadhaar: p.aadhaarNumber || '',
      Address: p.address || '', State: p.state || ''
    }));
    this.downloadXlsx(rows, 'PAN_Applications', ['Amount Paid']);
  }

  /**
   * Builds a totals row by summing the given numeric column keys across all
   * data rows, then writes the sheet with that totals row appended at the end.
   */
  downloadXlsx(data: any[], name: string, sumCols: string[] = []) {
    const finalRows = [...data];

    if (sumCols.length && data.length) {
      const totalsRow: any = {};
      // Find the first text-ish key to label the totals row
      const keys = Object.keys(data.find(r => Object.keys(r).length) || {});
      keys.forEach(k => { totalsRow[k] = sumCols.includes(k) ? 0 : ''; });
      const labelKey = keys.find(k => !sumCols.includes(k));
      if (labelKey) totalsRow[labelKey] = 'TOTAL';

      data.forEach(row => {
        sumCols.forEach(col => {
          const val = Number(row[col]) || 0;
          totalsRow[col] = (totalsRow[col] || 0) + val;
        });
      });

      finalRows.push({}); // blank spacer row
      finalRows.push(totalsRow);
    }

    const writeSheet = () => {
      const ws = XLSX.utils.json_to_sheet(finalRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, name);
      XLSX.writeFile(wb, `DJS_${name}_${this.startDate}_to_${this.endDate}.xlsx`);
    };

    if (typeof XLSX !== 'undefined') {
      writeSheet();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = writeSheet;
      document.head.appendChild(script);
    }
  }

  svcLabel(type: string) {
    const map: any = {
      printing:'Printing', xerox:'Xerox', scanning:'Scanning', photocopy:'Photocopy',
      online_application:'Online Application', spiral_binding:'Spiral Binding',
      pvc_card:'PVC Card', lamination:'Lamination', money_transfer:'Money Transfer',
      aeps:'AEPS', cash_for_online:'Cash for Online Payment', pan_service:'PAN Service', electricity_bill:'Electricity Bill', other:'Other'
    };
    return map[type] || type;
  }

  statusColor(v: string) {
    const map: any = { submitted:'#6366f1', processing:'#f59e0b', approved:'#10b981', delivered:'#3b82f6', rejected:'#ef4444' };
    return map[v] || '#94a3b8';
  }
}
