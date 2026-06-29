import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, TitleCasePipe, DecimalPipe, DatePipe,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule, MatTableModule
  ],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Transactions</div>
        <div class="page-subtitle">Add and manage cafe service transactions</div>
      </div>
    </div>

    <!-- ADD FORM -->
    <div class="djs-card mb-24">
      <p class="section-title">
        <mat-icon>{{ editMode ? 'edit' : 'add_circle' }}</mat-icon>
        {{ editMode ? 'Edit Transaction' : 'Add Transaction' }}
      </p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-grid cols-3">

          <!-- Date + Time -->
          <mat-form-field appearance="outline">
            <mat-label>Date *</mat-label>
            <input matInput type="date" formControlName="txDate">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Time *</mat-label>
            <input matInput type="time" formControlName="txTime">
          </mat-form-field>

          <!-- Service Type -->
          <mat-form-field appearance="outline">
            <mat-label>Service Type *</mat-label>
            <mat-select formControlName="serviceType" (selectionChange)="onServiceChange()">
              <mat-option *ngFor="let s of sortedServices" [value]="s.value">{{ s.label }}</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Payment Method (how customer pays you) -->
          <mat-form-field appearance="outline" *ngIf="!isCashForOnline">
            <mat-label>{{ isFeeBased ? 'Customer Payment Method *' : 'Payment Method *' }}</mat-label>
            <mat-select formControlName="paymentMethod" (selectionChange)="onPaymentChange()">
              <mat-option value="cash">Cash</mat-option>
              <mat-option value="online">Online (UPI / Bank)</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Normal amount (everything except transfer/aeps/fee-based) -->
          <mat-form-field appearance="outline" *ngIf="!isTransferOrAEPS && !isFeeBased">
            <mat-label>Amount Charged (₹) *</mat-label>
            <input matInput type="number" formControlName="amount" placeholder="0" min="0">
          </mat-form-field>

          <!-- Online payment → which bank receives full amount -->
          <mat-form-field appearance="outline" *ngIf="isOnline && !isFeeBased && !isCashForOnline">
            <mat-label>Received In (Bank / UPI) *</mat-label>
            <mat-select formControlName="bankAccountId" (selectionChange)="onBankSelect($event)">
              <mat-option *ngFor="let b of bankAccounts" [value]="b._id">
                {{ b.bankName }} — {{ b.accountName }}
                &nbsp;(₹{{ b.currentBalance | number:'1.0-0' }})
              </mat-option>
            </mat-select>
          </mat-form-field>

          <!-- ── FEE-BASED SERVICES: Online Application / Electricity Bill ── -->
          <ng-container *ngIf="isFeeBased">
            <mat-form-field appearance="outline">
              <mat-label>{{ isElectricity ? 'Bill Amount Paid (₹) *' : 'Application Fee Paid (₹) *' }}</mat-label>
              <input matInput type="number" formControlName="feePaid" placeholder="425" min="0">
              <mat-hint>Always debited from a bank account</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Pay Fee From Account *</mat-label>
              <mat-select formControlName="debitBankAccountId">
                <mat-option *ngFor="let b of bankAccounts" [value]="b._id">
                  {{ b.bankName }} — {{ b.accountName }}
                  &nbsp;(₹{{ b.currentBalance | number:'1.0-0' }})
                </mat-option>
              </mat-select>
              <mat-hint>Bank account the fee is debited from</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Amount Charged to Customer (₹) *</mat-label>
              <input matInput type="number" formControlName="amount" placeholder="600" min="0">
              <mat-hint>What you collect from the customer</mat-hint>
            </mat-form-field>

            <!-- If customer pays online, choose receiving bank (can differ from fee account) -->
            <mat-form-field appearance="outline" *ngIf="isOnline">
              <mat-label>Customer Payment Received In *</mat-label>
              <mat-select formControlName="bankAccountId" (selectionChange)="onBankSelect($event)">
                <mat-option *ngFor="let b of bankAccounts" [value]="b._id">
                  {{ b.bankName }} — {{ b.accountName }}
                  &nbsp;(₹{{ b.currentBalance | number:'1.0-0' }})
                </mat-option>
              </mat-select>
              <mat-hint>Where the customer's payment is credited</mat-hint>
            </mat-form-field>

            <div class="fee-info-box">
              <mat-icon>info</mat-icon>
              <div>
                Fee paid: <strong class="amount-negative">₹{{ form.get('feePaid')?.value || 0 | number:'1.0-0' }}</strong>
                &nbsp;·&nbsp; Collected: <strong class="amount-positive">₹{{ form.get('amount')?.value || 0 | number:'1.0-0' }}</strong>
                &nbsp;·&nbsp; Profit: <strong [class.amount-positive]="feeProfit>=0" [class.amount-negative]="feeProfit<0">₹{{ feeProfit | number:'1.0-0' }}</strong>
                <span *ngIf="!isOnline"> — Collected amount goes to <strong>Cash Register</strong></span>
              </div>
            </div>
          </ng-container>

          <!-- ── MONEY TRANSFER ── -->
          <ng-container *ngIf="isTransfer">
            <mat-form-field appearance="outline">
              <mat-label>Transfer Amount (₹) *</mat-label>
              <input matInput type="number" formControlName="transferAmount" placeholder="5000" min="0">
              <mat-hint>Amount sent to customer</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Commission Earned (₹) *</mat-label>
              <input matInput type="number" formControlName="commission" placeholder="50" min="0">
              <mat-hint>Your profit from this transfer</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Deduct Transfer From Account</mat-label>
              <mat-select formControlName="debitBankAccountId">
                <mat-option value="">— Cash (no bank deduction) —</mat-option>
                <mat-option *ngFor="let b of bankAccounts" [value]="b._id">
                  {{ b.bankName }} — {{ b.accountName }}
                  &nbsp;(₹{{ b.currentBalance | number:'1.0-0' }})
                </mat-option>
              </mat-select>
            </mat-form-field>
          </ng-container>

          <!-- ── AEPS WITHDRAWAL ── -->
          <ng-container *ngIf="isAEPS">
            <mat-form-field appearance="outline">
              <mat-label>Withdrawal Amount (₹) *</mat-label>
              <input matInput type="number" formControlName="transferAmount" placeholder="2000" min="0">
              <mat-hint>Cash given to customer (auto-deducted from cash register)</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Commission Earned (₹) *</mat-label>
              <input matInput type="number" formControlName="commission" placeholder="20" min="0">
            </mat-form-field>
            <div class="aeps-info-box">
              <mat-icon>info</mat-icon>
              <div>
                Cash of ₹{{ form.get('transferAmount')?.value || 0 | number:'1.0-0' }} will be auto-deducted
                from today's cash register. Profit = commission ₹{{ form.get('commission')?.value || 0 | number:'1.0-0' }}.
              </div>
            </div>
          </ng-container>

          <!-- ── CASH FOR ONLINE PAYMENT ── -->
          <!-- Customer pays you online, you hand them cash, you keep a commission -->
          <ng-container *ngIf="isCashForOnline">
            <mat-form-field appearance="outline">
              <mat-label>Cash Given to Customer (₹) *</mat-label>
              <input matInput type="number" formControlName="transferAmount" placeholder="2000" min="0">
              <mat-hint>Auto-deducted from cash register</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Commission Earned (₹) *</mat-label>
              <input matInput type="number" formControlName="commission" placeholder="20" min="0">
              <mat-hint>Your profit on top of the cash given</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Customer's Payment Received In *</mat-label>
              <mat-select formControlName="bankAccountId" (selectionChange)="onBankSelect($event)">
                <mat-option *ngFor="let b of bankAccounts" [value]="b._id">
                  {{ b.bankName }} — {{ b.accountName }}
                  &nbsp;(₹{{ b.currentBalance | number:'1.0-0' }})
                </mat-option>
              </mat-select>
              <mat-hint>Bank account credited with cash given + commission</mat-hint>
            </mat-form-field>
            <div class="cfo-info-box">
              <mat-icon>info</mat-icon>
              <div>
                Customer pays ₹{{ (form.get('transferAmount')?.value || 0) + (form.get('commission')?.value || 0) | number:'1.0-0' }}
                online into <strong>{{ selectedBankName || 'selected account' }}</strong>.
                Cash of ₹{{ form.get('transferAmount')?.value || 0 | number:'1.0-0' }} is given to them
                and auto-deducted from today's cash register.
                Profit = commission ₹{{ form.get('commission')?.value || 0 | number:'1.0-0' }}.
              </div>
            </div>
          </ng-container>

          <!-- Printer selection -->
          <mat-form-field appearance="outline" *ngIf="isPrinterService">
            <mat-label>Select Printer</mat-label>
            <mat-select formControlName="printerId" (selectionChange)="onPrinterChange($event)">
              <mat-option *ngFor="let p of printers" [value]="p._id">{{ p.name }} ({{ p.model }})</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" *ngIf="isPrinterService">
            <mat-label>Total Pages</mat-label>
            <input matInput type="number" formControlName="pages" placeholder="0" min="0">
          </mat-form-field>
          <mat-form-field appearance="outline" *ngIf="isPrinterService && selectedPrinterType !== 'bw'">
            <mat-label>Color Pages</mat-label>
            <input matInput type="number" formControlName="colorPages" placeholder="0" min="0">
          </mat-form-field>
          <mat-form-field appearance="outline" *ngIf="isPrinterService && selectedPrinterType !== 'color'">
            <mat-label>B&W Pages</mat-label>
            <input matInput type="number" formControlName="bwPages" placeholder="0" min="0">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Customer Name (optional)</mat-label>
            <input matInput formControlName="customerName" placeholder="Walk-in">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Customer Phone (optional)</mat-label>
            <input matInput formControlName="customerPhone" placeholder="9876543210">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Notes (optional)</mat-label>
            <input matInput formControlName="notes">
          </mat-form-field>
        </div>

        <!-- Profit preview (non fee-based / non aeps, since those have their own boxes) -->
        <div class="profit-preview" *ngIf="profitPreview !== null && !isFeeBased && !isAEPS && !isCashForOnline">
          <mat-icon>info</mat-icon>
          <span>
            <span *ngIf="isTransfer">Transfer: <strong>₹{{ form.get('transferAmount')?.value || 0 | number:'1.0-0' }}</strong> &nbsp;|&nbsp;</span>
            Profit: <strong class="amount-positive">₹{{ profitPreview | number:'1.0-0' }}</strong>
            <span *ngIf="isOnline && selectedBankName"> → <strong>{{ selectedBankName }}</strong></span>
            <span *ngIf="!isOnline"> → <strong>Cash</strong></span>
          </span>
        </div>

        <div class="form-actions">
          <button mat-stroked-button type="button" (click)="resetForm()" class="btn-outline">Clear</button>
          <button mat-flat-button type="submit" [disabled]="saving" class="btn-primary">
            <mat-icon>{{ saving ? 'hourglass_empty' : (editMode ? 'save' : 'add') }}</mat-icon>
            {{ editMode ? 'Update Transaction' : 'Add Transaction' }}
          </button>
        </div>
      </form>
    </div>

    <!-- FILTERS -->
    <div class="djs-card mb-16">
      <div class="search-bar">
        <mat-form-field appearance="outline" style="max-width:160px">
          <mat-label>From Date</mat-label>
          <input matInput type="date" [(ngModel)]="filterStart">
        </mat-form-field>
        <mat-form-field appearance="outline" style="max-width:160px">
          <mat-label>To Date</mat-label>
          <input matInput type="date" [(ngModel)]="filterEnd">
        </mat-form-field>
        <mat-form-field appearance="outline" style="max-width:180px">
          <mat-label>Service</mat-label>
          <mat-select [(ngModel)]="filterService">
            <mat-option value="">All Services</mat-option>
            <mat-option *ngFor="let s of sortedServices" [value]="s.value">{{ s.label }}</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-flat-button class="btn-primary" (click)="filterTx()">
          <mat-icon>filter_list</mat-icon> Filter
        </button>
        <button mat-stroked-button class="btn-outline" (click)="loadToday()">Recent</button>
        <div class="summary-chip" *ngIf="transactions.length">
          <mat-icon>payments</mat-icon>
          Profit: <strong class="amount-positive">₹{{ totalProfit }}</strong>
          &nbsp;·&nbsp; Cash: <strong style="color:var(--accent-warn)">₹{{ totalCash }}</strong>
          &nbsp;·&nbsp; Online: <strong class="amount-positive">₹{{ totalOnline }}</strong>
        </div>
      </div>
    </div>

    <!-- TABLE -->
    <div class="djs-card">
      <p class="section-title"><mat-icon>list</mat-icon> Recent Transactions ({{ transactions.length }})</p>

      <div *ngIf="loadingTx" class="flex-center" style="padding:32px">
        <mat-spinner diameter="36"></mat-spinner>
      </div>
      <div *ngIf="!loadingTx && !transactions.length" class="empty-state">
        <mat-icon>receipt_long</mat-icon><p>No transactions found</p>
      </div>

      <div *ngIf="!loadingTx && transactions.length" class="table-container scrollable-table">
        <table mat-table [dataSource]="transactions">
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date & Time</th>
            <td mat-cell *matCellDef="let t">
              <div>{{ t.date | date:'dd/MM/yy' }}</div>
              <div class="fs-12 text-muted">{{ t.date | date:'h:mm a' }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="service">
            <th mat-header-cell *matHeaderCellDef>Service</th>
            <td mat-cell *matCellDef="let t">
              <span class="badge badge-primary">{{ serviceLabel(t.serviceType) }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="customer">
            <th mat-header-cell *matHeaderCellDef>Customer</th>
            <td mat-cell *matCellDef="let t">
              <div>{{ t.customerName || '—' }}</div>
              <div class="fs-12 text-muted">{{ t.customerPhone }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="payment">
            <th mat-header-cell *matHeaderCellDef>Payment</th>
            <td mat-cell *matCellDef="let t">
              <span class="badge" [class.badge-info]="t.paymentMethod==='online'" [class.badge-default]="t.paymentMethod==='cash'">
                {{ t.paymentMethod | titlecase }}
              </span>
              <div class="fs-12 text-muted" *ngIf="t.bankAccountName">{{ t.bankAccountName }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="details">
            <th mat-header-cell *matHeaderCellDef>Details</th>
            <td mat-cell *matCellDef="let t">
              <span *ngIf="t.printerName" class="fs-12 text-muted">{{ t.printerName }}</span>
              <span *ngIf="t.serviceType==='money_transfer'" class="fs-12 text-muted">Transferred: ₹{{ t.transferAmount | number:'1.0-0' }}</span>
              <span *ngIf="t.serviceType==='aeps'" class="fs-12 text-muted">Withdrawn: ₹{{ t.transferAmount | number:'1.0-0' }}</span>
              <span *ngIf="t.serviceType==='cash_for_online'" class="fs-12 text-muted">Cash given: ₹{{ t.transferAmount | number:'1.0-0' }} ({{ t.bankAccountName || '—' }})</span>
              <span *ngIf="t.serviceType==='online_application' || t.serviceType==='electricity_bill'" class="fs-12 text-muted">
                Fee paid: ₹{{ t.feePaid | number:'1.0-0' }} ({{ t.debitBankAccountName || '—' }})
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let t" class="amount-positive">₹{{ t.amount | number:'1.0-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="profit">
            <th mat-header-cell *matHeaderCellDef>Profit</th>
            <td mat-cell *matCellDef="let t">
              <span [class.amount-positive]="t.profit>=0" [class.amount-negative]="t.profit<0">₹{{ t.profit | number:'1.0-2' }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let t">
              <button mat-icon-button (click)="editTx(t)" title="Edit"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button (click)="deleteTx(t._id)" title="Delete" style="color:var(--accent-danger)"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .profit-preview {
      display:flex;align-items:center;gap:8px;padding:10px 16px;margin-top:8px;
      background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);
      border-radius:var(--radius-sm);font-size:13px;color:var(--text-secondary);
    }
    .profit-preview mat-icon { color:var(--accent-success);font-size:18px!important;flex-shrink:0; }
    .summary-chip {
      display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);
      margin-left:auto;padding:6px 14px;background:var(--bg-surface);border-radius:var(--radius-sm);flex-wrap:wrap;
    }
    .summary-chip mat-icon { font-size:16px!important;color:var(--accent-success); }
    .aeps-info-box, .fee-info-box, .cfo-info-box {
      display:flex;align-items:flex-start;gap:10px;padding:12px 16px;
      background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);
      border-radius:var(--radius-sm);font-size:12px;color:var(--text-secondary);
      grid-column: span 3;
    }
    .aeps-info-box mat-icon, .fee-info-box mat-icon, .cfo-info-box mat-icon { color:var(--accent-warn);font-size:18px!important;flex-shrink:0;margin-top:1px; }

    /* Scrollable transaction list — keeps the page height fixed even when
       there are hundreds of transactions; scroll happens inside this box. */
    .scrollable-table {
      max-height: 520px;
      overflow-y: auto;
      position: relative;
    }
    .scrollable-table table { width: 100%; }
    .scrollable-table ::ng-deep .mat-mdc-header-row {
      position: sticky;
      top: 0;
      z-index: 2;
      background: var(--bg-card) !important;
    }
  `]
})
export class TransactionsComponent implements OnInit {
  form!: FormGroup;
  transactions: any[] = [];
  printers: any[]     = [];
  bankAccounts: any[] = [];
  saving      = false;
  loadingTx   = false;
  editMode    = false;
  editId      = '';
  filterStart = '';
  filterEnd   = '';
  filterService = '';
  selectedPrinterType = 'both';
  selectedBankName    = '';
  cols = ['date','service','customer','payment','details','amount','profit','actions'];

  services = [
    { value:'printing',           label:'Printing' },
    { value:'xerox',              label:'Xerox' },
    { value:'scanning',           label:'Scanning' },
    { value:'photocopy',          label:'Photocopy' },
    { value:'online_application', label:'Online Application' },
    { value:'electricity_bill',   label:'Electricity Bill Payment' },
    { value:'spiral_binding',     label:'Spiral Binding' },
    { value:'pvc_card',           label:'PVC Card Printing' },
    { value:'lamination',         label:'Lamination' },
    { value:'money_transfer',     label:'Online Money Transfer' },
    { value:'aeps',               label:'AEPS Withdrawal' },
    { value:'cash_for_online',    label:'Cash for Online Payment' },
    { value:'pan_service',        label:'PAN Service' },
    { value:'other',              label:'Other' }
  ];

  serviceUsageCounts: Record<string, number> = {};

  get sortedServices() {
    return [...this.services].sort((a, b) =>
      (this.serviceUsageCounts[b.value] || 0) - (this.serviceUsageCounts[a.value] || 0)
    );
  }

  constructor(private api: ApiService, private fb: FormBuilder, private snack: MatSnackBar) {}

  ngOnInit() {
    this.buildForm();
    this.loadToday();
    this.api.getPrinters().subscribe(r => this.printers = r.data || []);
    this.api.getBankAccounts().subscribe(r => this.bankAccounts = r.data || []);
    this.loadServiceUsage();
  }

  loadServiceUsage() {
    // Pull all-time counts per service to rank the dropdown by popularity
    this.api.getTransactionStats().subscribe({
      next: (r) => {
        const byService = r.data?.byService || [];
        const counts: Record<string, number> = {};
        byService.forEach((s: any) => { counts[s._id] = s.count || 0; });
        this.serviceUsageCounts = counts;
      },
      error: () => {}
    });
  }

  buildForm() {
    const now   = new Date();
    const today = now.toISOString().split('T')[0];
    const time  = now.toTimeString().slice(0, 5);
    this.form = this.fb.group({
      txDate: [today, Validators.required],
      txTime: [time,  Validators.required],
      serviceType:   ['', Validators.required],
      paymentMethod: ['cash', Validators.required],
      amount:         [null],
      commission:     [null],
      transferAmount: [null],
      feePaid:        [null],
      bankAccountId:        [null],
      bankAccountName:      [''],
      debitBankAccountId:   [null],
      debitBankAccountName: [''],
      printerId: [null],
      pages: [null], colorPages: [null], bwPages: [null],
      customerName: [''], customerPhone: [''], notes: ['']
    });
  }

  get isOnline()         { return this.form.get('paymentMethod')?.value === 'online'; }
  get isTransfer()       { return this.form.get('serviceType')?.value === 'money_transfer'; }
  get isAEPS()           { return this.form.get('serviceType')?.value === 'aeps'; }
  get isCashForOnline()  { return this.form.get('serviceType')?.value === 'cash_for_online'; }
  get isTransferOrAEPS() { return this.isTransfer || this.isAEPS || this.isCashForOnline; }
  get isElectricity()    { return this.form.get('serviceType')?.value === 'electricity_bill'; }
  get isFeeBased()       { return ['online_application','electricity_bill'].includes(this.form.get('serviceType')?.value || ''); }
  get isPrinterService() { return ['printing','xerox'].includes(this.form.get('serviceType')?.value || ''); }

  get feeProfit(): number {
    const v = this.form.value;
    return (v.amount || 0) - (v.feePaid || 0);
  }

  get profitPreview(): number | null {
    const v = this.form.value;
    if (this.isTransferOrAEPS) return v.commission || 0;
    if (this.isFeeBased)       return this.feeProfit;
    if (v.amount)               return v.amount;
    return null;
  }

  get totalProfit() { return this.transactions.reduce((s,t)=>s+(t.profit||0),0).toLocaleString('en-IN'); }
  get totalCash()   { return this.transactions.filter(t=>t.paymentMethod==='cash').reduce((s,t)=>s+(t.profit||0),0).toLocaleString('en-IN'); }
  get totalOnline() { return this.transactions.filter(t=>t.paymentMethod==='online').reduce((s,t)=>s+(t.profit||0),0).toLocaleString('en-IN'); }

  onServiceChange() {
    this.form.patchValue({
      amount: null, commission: null, transferAmount: null, feePaid: null,
      printerId: null, pages: null, colorPages: null, bwPages: null,
      debitBankAccountId: null, debitBankAccountName: '',
      bankAccountId: null, bankAccountName: ''
    });
    this.selectedBankName = '';
  }

  onPaymentChange() {
    if (!this.isOnline) {
      this.form.patchValue({ bankAccountId: null, bankAccountName: '' });
      this.selectedBankName = '';
    }
  }

  onBankSelect(e: any) {
    const bank = this.bankAccounts.find((b: any) => b._id === e.value);
    this.selectedBankName = bank ? `${bank.bankName} — ${bank.accountName}` : '';
    this.form.patchValue({ bankAccountName: this.selectedBankName });
  }

  onPrinterChange(e: any) {
    const p = this.printers.find((p: any) => p._id === e.value);
    if (p) this.selectedPrinterType = p.type;
  }

  loadToday() {
    // Loads recent transactions across all dates (not just today) so the list
    // always has something useful to scroll through, newest first.
    this.loadingTx = true;
    this.api.getTransactions({ limit: 100 }).subscribe({
      next: r => { this.transactions = r.data || []; this.loadingTx = false; },
      error: () => this.loadingTx = false
    });
  }

  filterTx() {
    const params: any = {};
    if (this.filterStart)   params.startDate   = this.filterStart;
    if (this.filterEnd)     params.endDate     = this.filterEnd;
    if (this.filterService) params.serviceType = this.filterService;
    this.loadingTx = true;
    this.api.getTransactions(params).subscribe({
      next: r => { this.transactions = r.data || []; this.loadingTx = false; },
      error: () => this.loadingTx = false
    });
  }

  submit() {
    if (this.form.invalid) {
      this.snack.open('Please fill all required fields', '', { duration: 3000 });
      return;
    }

    const v = this.form.value;

    if (this.isTransferOrAEPS) {
      if (!v.transferAmount || v.transferAmount <= 0) {
        this.snack.open(this.isAEPS ? 'Enter withdrawal amount' : this.isCashForOnline ? 'Enter cash amount given' : 'Enter transfer amount', '', { duration: 3000 });
        return;
      }
      if (v.commission === null || v.commission === undefined || v.commission < 0) {
        this.snack.open('Enter commission earned', '', { duration: 3000 });
        return;
      }
      if (this.isCashForOnline && !v.bankAccountId) {
        this.snack.open('Select account where customer payment is received', '', { duration: 3000 });
        return;
      }
    } else if (this.isFeeBased) {
      if (!v.feePaid || v.feePaid <= 0) {
        this.snack.open(this.isElectricity ? 'Enter bill amount' : 'Enter application fee', '', { duration: 3000 });
        return;
      }
      if (!v.debitBankAccountId) {
        this.snack.open('Select the account to pay the fee from', '', { duration: 3000 });
        return;
      }
      if (!v.amount || v.amount <= 0) {
        this.snack.open('Enter amount charged to customer', '', { duration: 3000 });
        return;
      }
      if (this.isOnline && !v.bankAccountId) {
        this.snack.open('Select account to receive customer payment', '', { duration: 3000 });
        return;
      }
    } else if (!v.amount || v.amount <= 0) {
      this.snack.open('Enter a valid amount', '', { duration: 3000 });
      return;
    }

    const combinedDate = new Date(`${v.txDate}T${v.txTime}:00`);
    const printer    = this.printers.find((p: any) => p._id === v.printerId);
    const debitBank  = this.bankAccounts.find((b: any) => b._id === v.debitBankAccountId);
    const creditBank = this.bankAccounts.find((b: any) => b._id === v.bankAccountId);

    const payload: any = {
      date:          v.txDate ? combinedDate : new Date(),
      serviceType:   v.serviceType,
      paymentMethod: this.isCashForOnline ? 'online' : v.paymentMethod,
      customerName:  v.customerName  || '',
      customerPhone: v.customerPhone || '',
      notes:         v.notes || ''
    };

    if (this.isTransferOrAEPS) {
      payload.amount         = v.transferAmount || 0;
      payload.commission     = v.commission || 0;
      payload.transferAmount = v.transferAmount || 0;
      if (this.isCashForOnline) {
        // Money comes IN here, so it's a credit to bankAccountId, not a debit
        if (v.bankAccountId) {
          payload.bankAccountId   = v.bankAccountId;
          payload.bankAccountName = creditBank ? `${creditBank.bankName} — ${creditBank.accountName}` : '';
        }
      } else if (v.debitBankAccountId) {
        payload.debitBankAccountId   = v.debitBankAccountId;
        payload.debitBankAccountName = debitBank ? `${debitBank.bankName} — ${debitBank.accountName}` : '';
      }
    } else if (this.isFeeBased) {
      payload.amount              = v.amount || 0;
      payload.feePaid             = v.feePaid || 0;
      payload.debitBankAccountId  = v.debitBankAccountId;
      payload.debitBankAccountName= debitBank ? `${debitBank.bankName} — ${debitBank.accountName}` : '';
      if (this.isOnline) {
        payload.bankAccountId   = v.bankAccountId;
        payload.bankAccountName = creditBank ? `${creditBank.bankName} — ${creditBank.accountName}` : '';
      }
    } else {
      payload.amount = v.amount || 0;
      if (this.isOnline) {
        payload.bankAccountId   = v.bankAccountId;
        payload.bankAccountName = creditBank ? `${creditBank.bankName} — ${creditBank.accountName}` : '';
      }
    }

    if (this.isPrinterService) {
      payload.printerId    = v.printerId || null;
      payload.printerName  = printer?.name || '';
      payload.pages         = v.pages      || 0;
      payload.colorPages    = v.colorPages || 0;
      payload.bwPages       = v.bwPages    || 0;
    }

    this.saving = true;
    const req = this.editMode
      ? this.api.updateTransaction(this.editId, payload)
      : this.api.createTransaction(payload);

    req.subscribe({
      next: () => {
        this.snack.open(this.editMode ? 'Transaction updated!' : 'Transaction added!', '', { duration: 2500, panelClass: 'snack-success' });
        this.resetForm();
        this.loadToday();
        this.saving = false;
      },
      error: e => {
        this.snack.open('Error: ' + (e.error?.error || 'Failed to save'), '', { duration: 4000, panelClass: 'snack-error' });
        this.saving = false;
      }
    });
  }

  editTx(t: any) {
    this.editMode = true;
    this.editId   = t._id;
    const d = new Date(t.date);
    const txDate = d.toISOString().split('T')[0];
    const txTime = d.toTimeString().slice(0, 5);
    this.form.patchValue({ ...t, txDate, txTime });
    this.selectedBankName = t.bankAccountName || '';
    const printer = this.printers.find((p: any) => p._id === t.printerId);
    if (printer) this.selectedPrinterType = printer.type;
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteTx(id: string) {
    if (!confirm('Delete this transaction?')) return;
    this.api.deleteTransaction(id).subscribe({
      next: () => { this.snack.open('Deleted', '', { duration: 2000 }); this.loadToday(); },
      error: () => this.snack.open('Delete failed', '', { duration: 3000, panelClass: 'snack-error' })
    });
  }

  resetForm() {
    this.editMode = false;
    this.editId   = '';
    this.selectedBankName    = '';
    this.selectedPrinterType = 'both';
    this.buildForm();
  }

  serviceLabel(type: string) {
    return this.services.find(s => s.value === type)?.label || type;
  }
}
