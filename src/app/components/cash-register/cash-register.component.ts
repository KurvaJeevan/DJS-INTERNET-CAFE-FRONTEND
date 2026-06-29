import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-cash-register',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe, DecimalPipe,
    MatIconModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule, MatTableModule
  ],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Cash Register</div>
        <div class="page-subtitle">Track daily cash — opening balance, cash sales, and closing count</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <mat-form-field appearance="outline" style="max-width:160px;margin-bottom:-22px">
          <mat-label>Date</mat-label>
          <input matInput type="date" [(ngModel)]="selectedDate" (change)="loadRegister()">
        </mat-form-field>
        <button mat-stroked-button class="btn-outline" (click)="setToday()">Today</button>
      </div>
    </div>

    <div *ngIf="loading" class="flex-center" style="height:200px">
      <mat-spinner diameter="40"></mat-spinner>
    </div>

    <div *ngIf="!loading">
      <!-- TOP STAT CARDS -->
      <div class="grid-4 mb-24">
        <div class="stat-card info">
          <mat-icon class="stat-icon">account_balance_wallet</mat-icon>
          <div class="stat-label">Opening Cash</div>
          <div class="stat-value">₹{{ register?.openingCash || 0 | number:'1.0-2' }}</div>
          <div class="stat-sub">Start of day</div>
        </div>
        <div class="stat-card success">
          <mat-icon class="stat-icon">arrow_downward</mat-icon>
          <div class="stat-label">Cash Sales Today</div>
          <div class="stat-value amount-positive">₹{{ register?.cashIn || 0 | number:'1.0-2' }}</div>
          <div class="stat-sub">From cash transactions</div>
        </div>
        <div class="stat-card danger">
          <mat-icon class="stat-icon">arrow_upward</mat-icon>
          <div class="stat-label">Cash Expenses</div>
          <div class="stat-value amount-negative">₹{{ register?.cashOut || 0 | number:'1.0-2' }}</div>
          <div class="stat-sub">Expenses paid in cash</div>
        </div>
        <div class="stat-card" [class.success]="(register?.expectedCash||0)>=0">
          <mat-icon class="stat-icon">calculate</mat-icon>
          <div class="stat-label">Expected Cash</div>
          <div class="stat-value amount-positive">₹{{ register?.expectedCash || 0 | number:'1.0-2' }}</div>
          <div class="stat-sub">Opening + Sales − Expenses</div>
        </div>
      </div>

      <!-- CLOSING STATUS -->
      <div class="djs-card mb-24" *ngIf="register?.closingCash !== null && register?.closingCash !== undefined">
        <div class="closing-banner" [class.match]="(register?.difference||0)===0" [class.over]="(register?.difference||0)>0" [class.short]="(register?.difference||0)<0">
          <mat-icon>{{ (register?.difference||0)===0 ? 'check_circle' : (register?.difference||0)>0 ? 'trending_up' : 'warning' }}</mat-icon>
          <div>
            <div class="closing-title">Day Closed</div>
            <div class="closing-sub">
              Counted: <strong>₹{{ register?.closingCash | number:'1.0-2' }}</strong> &nbsp;|&nbsp;
              Expected: <strong>₹{{ register?.expectedCash | number:'1.0-2' }}</strong> &nbsp;|&nbsp;
              <span [class.amount-positive]="(register?.difference||0)>=0" [class.amount-negative]="(register?.difference||0)<0">
                {{ (register?.difference||0) >= 0 ? 'Surplus' : 'Shortage' }}: <strong>₹{{ (register?.difference||0) | number:'1.0-2' }}</strong>
              </span>
            </div>
          </div>
          <button mat-stroked-button class="btn-outline" (click)="unlockDay()" style="margin-left:auto">Reopen</button>
        </div>
      </div>

      <div class="grid-2">
        <!-- SET OPENING CASH -->
        <div class="djs-card">
          <p class="section-title"><mat-icon>lock_open</mat-icon> Set Opening Cash</p>
          <p class="text-muted fs-12 mb-16">
            Enter how much cash was in the drawer at the start of this day.
            Yesterday's closing balance is auto-suggested.
          </p>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>Opening Cash (₹)</mat-label>
              <input matInput type="number" [(ngModel)]="openingInput" placeholder="0">
              <mat-icon matPrefix style="color:var(--accent-info)">account_balance_wallet</mat-icon>
            </mat-form-field>
            <button mat-flat-button class="btn-primary" (click)="saveOpening()" [disabled]="saving" style="margin-top:4px;height:56px">
              <mat-icon>save</mat-icon> Save
            </button>
          </div>
          <div class="info-box mt-16">
            <mat-icon>info</mat-icon>
            Cash sales are pulled automatically from today's cash transactions.
            You don't need to add them manually here.
          </div>
        </div>

        <!-- CLOSE DAY -->
        <div class="djs-card">
          <p class="section-title"><mat-icon>lock</mat-icon> Close Day</p>
          <p class="text-muted fs-12 mb-16">
            Count the physical cash in the drawer at end of day and enter it here.
            Any difference from expected will be shown.
          </p>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <mat-form-field appearance="outline" style="flex:1">
              <mat-label>Counted Cash (₹)</mat-label>
              <input matInput type="number" [(ngModel)]="closingInput" placeholder="0">
              <mat-icon matPrefix style="color:var(--accent-success)">point_of_sale</mat-icon>
            </mat-form-field>
            <button mat-flat-button class="btn-success" (click)="closeDay()" [disabled]="saving" style="margin-top:4px;height:56px">
              <mat-icon>lock</mat-icon> Close
            </button>
          </div>
          <mat-form-field appearance="outline" class="mt-16" style="width:100%">
            <mat-label>Notes (optional)</mat-label>
            <input matInput [(ngModel)]="closingNotes" placeholder="Any remarks for today...">
          </mat-form-field>
          <div class="preview-box" *ngIf="closingInput !== null && closingInput !== undefined">
            <div class="preview-row">
              <span>Expected Cash</span>
              <span>₹{{ register?.expectedCash || 0 | number:'1.0-2' }}</span>
            </div>
            <div class="preview-row">
              <span>Counted Cash</span>
              <span>₹{{ closingInput | number:'1.0-2' }}</span>
            </div>
            <div class="preview-row total" [class.positive]="difference>=0" [class.negative]="difference<0">
              <span>{{ difference >= 0 ? '✅ Surplus' : '⚠️ Shortage' }}</span>
              <span>₹{{ difference | number:'1.0-2' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- CASH BREAKDOWN -->
      <div class="djs-card mt-24">
        <p class="section-title"><mat-icon>receipt_long</mat-icon> Today's Cash Flow Breakdown</p>
        <div class="breakdown-rows">
          <div class="br-row">
            <div class="br-label"><mat-icon style="color:var(--accent-info)">open_in_new</mat-icon> Opening Cash</div>
            <div class="br-val">₹{{ register?.openingCash || 0 | number:'1.0-2' }}</div>
          </div>
          <div class="br-row positive">
            <div class="br-label"><mat-icon style="color:var(--accent-success)">add_circle</mat-icon> Cash Sales (Auto from transactions)</div>
            <div class="br-val amount-positive">+ ₹{{ register?.cashIn || 0 | number:'1.0-2' }}</div>
          </div>
          <div class="br-row negative">
            <div class="br-label"><mat-icon style="color:var(--accent-danger)">remove_circle</mat-icon> Cash Expenses</div>
            <div class="br-val amount-negative">− ₹{{ register?.cashOut || 0 | number:'1.0-2' }}</div>
          </div>
          <div class="br-row total">
            <div class="br-label"><mat-icon style="color:var(--accent-primary)">calculate</mat-icon> Expected in Drawer</div>
            <div class="br-val amount-positive fw-700">₹{{ register?.expectedCash || 0 | number:'1.0-2' }}</div>
          </div>
          <div class="br-row" *ngIf="register?.closingCash !== null && register?.closingCash !== undefined">
            <div class="br-label"><mat-icon style="color:var(--accent-warn)">point_of_sale</mat-icon> Counted Cash</div>
            <div class="br-val fw-700">₹{{ register?.closingCash | number:'1.0-2' }}</div>
          </div>
          <div class="br-row" *ngIf="register?.closingCash !== null && register?.closingCash !== undefined"
               [class.positive]="(register?.difference||0)>=0" [class.negative]="(register?.difference||0)<0">
            <div class="br-label">
              <mat-icon>{{ (register?.difference||0)>=0 ? 'trending_up' : 'trending_down' }}</mat-icon>
              {{ (register?.difference||0)>=0 ? 'Surplus' : 'Shortage' }}
            </div>
            <div class="br-val" [class.amount-positive]="(register?.difference||0)>=0" [class.amount-negative]="(register?.difference||0)<0">
              ₹{{ register?.difference || 0 | number:'1.0-2' }}
            </div>
          </div>
        </div>
      </div>

      <!-- HISTORY -->
      <div class="djs-card mt-24">
        <p class="section-title"><mat-icon>history</mat-icon> Recent Cash History</p>
        <div *ngIf="!history.length" class="empty-state"><mat-icon>history</mat-icon><p>No history yet</p></div>
        <div class="table-container" *ngIf="history.length">
          <table mat-table [dataSource]="history">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let r">{{ r.date }}</td>
            </ng-container>
            <ng-container matColumnDef="opening">
              <th mat-header-cell *matHeaderCellDef>Opening</th>
              <td mat-cell *matCellDef="let r">₹{{ r.openingCash | number:'1.0-0' }}</td>
            </ng-container>
            <ng-container matColumnDef="cashIn">
              <th mat-header-cell *matHeaderCellDef>Cash In</th>
              <td mat-cell *matCellDef="let r" class="amount-positive">₹{{ r.cashIn | number:'1.0-0' }}</td>
            </ng-container>
            <ng-container matColumnDef="cashOut">
              <th mat-header-cell *matHeaderCellDef>Cash Out</th>
              <td mat-cell *matCellDef="let r" class="amount-negative">₹{{ r.cashOut | number:'1.0-0' }}</td>
            </ng-container>
            <ng-container matColumnDef="closing">
              <th mat-header-cell *matHeaderCellDef>Counted</th>
              <td mat-cell *matCellDef="let r">
                <span *ngIf="r.closingCash !== null && r.closingCash !== undefined">₹{{ r.closingCash | number:'1.0-0' }}</span>
                <span *ngIf="r.closingCash === null || r.closingCash === undefined" class="badge badge-warn">Open</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let r">
                <span class="badge" [class.badge-success]="r.isLocked" [class.badge-warn]="!r.isLocked">
                  {{ r.isLocked ? 'Closed' : 'Open' }}
                </span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="historyCols"></tr>
            <tr mat-row *matRowDef="let row; columns: historyCols;" style="cursor:pointer" (click)="goToDate(row.date)"></tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .closing-banner {
      display:flex; align-items:center; gap:16px; padding:16px 20px;
      border-radius:var(--radius-md); border:1px solid;
    }
    .closing-banner.match { background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.3); }
    .closing-banner.match mat-icon { color:var(--accent-success); }
    .closing-banner.over  { background:rgba(59,130,246,0.1);  border-color:rgba(59,130,246,0.3); }
    .closing-banner.over  mat-icon { color:var(--accent-info); }
    .closing-banner.short { background:rgba(245,158,11,0.1);  border-color:rgba(245,158,11,0.3); }
    .closing-banner.short mat-icon { color:var(--accent-warn); }
    .closing-title { font-size:14px; font-weight:600; color:var(--text-primary); }
    .closing-sub   { font-size:12px; color:var(--text-secondary); margin-top:2px; }

    .info-box {
      display:flex; align-items:flex-start; gap:8px;
      background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2);
      border-radius:var(--radius-sm); padding:10px 14px;
      font-size:12px; color:var(--text-secondary);
    }
    .info-box mat-icon { color:var(--accent-info); font-size:16px!important; flex-shrink:0; margin-top:1px; }

    .preview-box {
      background:var(--bg-surface); border-radius:var(--radius-sm);
      border:1px solid var(--border); overflow:hidden;
    }
    .preview-row {
      display:flex; justify-content:space-between; align-items:center;
      padding:10px 16px; border-bottom:1px solid var(--border); font-size:13px;
    }
    .preview-row:last-child { border-bottom:none; }
    .preview-row.total { font-weight:700; font-size:14px; }
    .preview-row.total.positive { background:rgba(16,185,129,0.08); }
    .preview-row.total.negative { background:rgba(239,68,68,0.08); }

    .breakdown-rows { display:flex; flex-direction:column; gap:2px; }
    .br-row {
      display:flex; align-items:center; justify-content:space-between;
      padding:12px 16px; border-radius:var(--radius-sm); font-size:14px;
    }
    .br-row:hover { background:var(--bg-card-hover); }
    .br-row.total { background:var(--bg-surface); margin-top:4px; font-weight:700; font-size:15px; border:1px solid var(--border); }
    .br-row.positive { color:var(--accent-success); }
    .br-row.negative { color:var(--accent-danger); }
    .br-label { display:flex; align-items:center; gap:8px; color:var(--text-secondary); }
    .br-label mat-icon { font-size:18px!important; }
    .br-val { font-weight:600; color:var(--text-primary); }
  `]
})
export class CashRegisterComponent implements OnInit {
  register: any = null;
  history: any[] = [];
  loading = false;
  saving  = false;
  selectedDate = new Date().toISOString().split('T')[0];
  openingInput: number | null = null;
  closingInput: number | null = null;
  closingNotes = '';
  historyCols = ['date','opening','cashIn','cashOut','closing','status'];

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() { this.loadRegister(); this.loadHistory(); }

  setToday() { this.selectedDate = new Date().toISOString().split('T')[0]; this.loadRegister(); }

  goToDate(date: string) { this.selectedDate = date; this.loadRegister(); }

  loadRegister() {
    this.loading = true;
    this.api.getCashRegister(this.selectedDate).subscribe({
      next: r => {
        this.register = r.data;
        this.openingInput = r.data.openingCash ?? 0;
        this.closingInput = r.data.closingCash ?? null;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadHistory() {
    this.api.getCashHistory().subscribe({
      next: r => { this.history = r.data || []; },
      error: () => {}
    });
  }

  get difference(): number {
    if (this.closingInput === null || this.closingInput === undefined) return 0;
    return this.closingInput - (this.register?.expectedCash || 0);
  }

  saveOpening() {
    if (this.openingInput === null) return;
    this.saving = true;
    this.api.setCashOpening({ date: this.selectedDate, openingCash: this.openingInput }).subscribe({
      next: () => {
        this.snack.open('Opening cash saved!', '', { duration: 2500, panelClass: 'snack-success' });
        this.loadRegister();
        this.loadHistory();
        this.saving = false;
      },
      error: e => { this.snack.open('Error: ' + (e.error?.error || 'Failed'), '', { duration: 3000, panelClass: 'snack-error' }); this.saving = false; }
    });
  }

  closeDay() {
    if (this.closingInput === null || this.closingInput === undefined) {
      this.snack.open('Enter counted cash amount', '', { duration: 3000 }); return;
    }
    this.saving = true;
    this.api.closeCashDay(this.selectedDate, { closingCash: this.closingInput, notes: this.closingNotes }).subscribe({
      next: () => {
        this.snack.open('Day closed successfully!', '', { duration: 2500, panelClass: 'snack-success' });
        this.loadRegister();
        this.loadHistory();
        this.saving = false;
      },
      error: e => { this.snack.open('Error: ' + (e.error?.error || 'Failed'), '', { duration: 3000, panelClass: 'snack-error' }); this.saving = false; }
    });
  }

  unlockDay() {
    this.api.setCashOpening({ date: this.selectedDate, openingCash: this.register?.openingCash || 0 }).subscribe({
      next: () => {
        // Reset closing
        this.closingInput = null;
        this.loadRegister();
      }
    });
  }
}
