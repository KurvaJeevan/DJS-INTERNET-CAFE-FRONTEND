import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { SlicePipe, TitleCasePipe, DecimalPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-bank-accounts',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule, MatTabsModule,
    SlicePipe, TitleCasePipe, DecimalPipe, DatePipe
  ],
  template: `
    <div class="page-header">
      <div><div class="page-title">Bank Accounts</div><div class="page-subtitle">Track balances and transactions for all accounts</div></div>
      <button mat-flat-button class="btn-primary" (click)="toggleAccountForm()">
        <mat-icon>{{ showAccountForm ? 'close' : 'add' }}</mat-icon>
        {{ showAccountForm ? 'Cancel' : (editingAccount ? 'Edit Account' : 'Add Account') }}
      </button>
    </div>

    <!-- ADD / EDIT ACCOUNT FORM -->
    <div class="djs-card mb-24" *ngIf="showAccountForm">
      <p class="section-title"><mat-icon>account_balance</mat-icon> {{ editingAccount ? 'Edit Bank Account' : 'Add Bank Account' }}</p>
      <form [formGroup]="accountForm" (ngSubmit)="submitAccount()">
        <div class="form-grid cols-3">
          <mat-form-field appearance="outline">
            <mat-label>Bank Name</mat-label>
            <input matInput formControlName="bankName" placeholder="e.g. SBI, HDFC, Paytm">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Account Name</mat-label>
            <input matInput formControlName="accountName" placeholder="Account holder name">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Account Type</mat-label>
            <mat-select formControlName="accountType">
              <mat-option value="savings">Savings</mat-option>
              <mat-option value="current">Current</mat-option>
              <mat-option value="upi">UPI / Wallet</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Account Number (optional)</mat-label>
            <input matInput formControlName="accountNumber" placeholder="XXXXXX1234">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>IFSC Code (optional)</mat-label>
            <input matInput formControlName="ifscCode" placeholder="SBIN0001234">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Opening Balance (₹)</mat-label>
            <input matInput type="number" formControlName="openingBalance" placeholder="0">
          </mat-form-field>
        </div>
        <div class="form-actions">
          <button mat-stroked-button type="button" (click)="cancelAccountForm()" class="btn-outline">Cancel</button>
          <button mat-flat-button type="submit" [disabled]="savingAccount" class="btn-primary">
            <mat-icon>save</mat-icon> {{ editingAccount ? 'Update Account' : 'Save Account' }}
          </button>
        </div>
      </form>
    </div>

    <!-- ACCOUNTS GRID -->
    <div *ngIf="loading" class="flex-center" style="height:200px"><mat-spinner diameter="40"></mat-spinner></div>
    <div *ngIf="!loading && !accounts.length" class="empty-state djs-card">
      <mat-icon>account_balance</mat-icon>
      <p>No bank accounts added yet</p>
    </div>

    <div class="accounts-grid">
      <div *ngFor="let acc of accounts" class="account-card djs-card" [class.selected]="selectedAccount?._id===acc._id" (click)="selectAccount(acc)">
        <!-- Account Header -->
        <div class="acc-header">
          <div class="acc-icon" [style.background]="bankColor(acc.bankName)+'22'" [style.color]="bankColor(acc.bankName)">
            <mat-icon>account_balance</mat-icon>
          </div>
          <div class="acc-meta">
            <div class="acc-bank">{{ acc.bankName }}</div>
            <div class="acc-name text-muted fs-12">{{ acc.accountName }}</div>
            <span class="badge badge-default mt-4">{{ acc.accountType | titlecase }}</span>
          </div>
          <div class="acc-actions">
            <button mat-icon-button (click)="editAccount(acc); $event.stopPropagation()" title="Edit">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button (click)="deleteAccount(acc._id); $event.stopPropagation()" title="Delete" style="color:var(--accent-danger)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>

        <div class="djs-divider"></div>

        <!-- Balance -->
        <div class="balance-section">
          <div class="balance-item">
            <div class="balance-label">Opening</div>
            <div class="balance-val">₹{{ (acc.openingBalance||0)|number:'1.0-2' }}</div>
          </div>
          <div class="balance-arrow"><mat-icon>arrow_forward</mat-icon></div>
          <div class="balance-item">
            <div class="balance-label">Current Balance</div>
            <div class="balance-val current" [class.amount-positive]="acc.currentBalance>=0" [class.amount-negative]="acc.currentBalance<0">
              ₹{{ (acc.currentBalance||0)|number:'1.0-2' }}
            </div>
          </div>
        </div>

        <!-- Quick stats -->
        <div class="acc-stats">
          <div class="acc-stat">
            <mat-icon style="color:var(--accent-success);font-size:14px!important">arrow_downward</mat-icon>
            <span class="amount-positive">₹{{ totalCredit(acc) }}</span>
            <span class="text-muted fs-12">In</span>
          </div>
          <div class="acc-stat">
            <mat-icon style="color:var(--accent-danger);font-size:14px!important">arrow_upward</mat-icon>
            <span class="amount-negative">₹{{ totalDebit(acc) }}</span>
            <span class="text-muted fs-12">Out</span>
          </div>
          <div class="acc-stat">
            <mat-icon style="color:var(--text-muted);font-size:14px!important">receipt</mat-icon>
            <span>{{ acc.transactions?.length || 0 }}</span>
            <span class="text-muted fs-12">Tx</span>
          </div>
        </div>

        <div class="select-hint" *ngIf="selectedAccount?._id!==acc._id">
          <mat-icon>touch_app</mat-icon> Click to manage transactions
        </div>
      </div>
    </div>

    <!-- SELECTED ACCOUNT TRANSACTIONS -->
    <div class="djs-card mt-24" *ngIf="selectedAccount">
      <div class="flex-between mb-16">
        <p class="section-title" style="margin-bottom:0">
          <mat-icon>receipt_long</mat-icon> {{ selectedAccount.bankName }} — Transactions
        </p>
        <button mat-flat-button class="btn-primary" (click)="showTxForm=!showTxForm">
          <mat-icon>{{ showTxForm ? 'close' : 'add' }}</mat-icon> {{ showTxForm ? 'Cancel' : 'Add Transaction' }}
        </button>
      </div>

      <!-- Add Transaction Form -->
      <div *ngIf="showTxForm" class="tx-form-wrap mb-16">
        <form [formGroup]="txForm" (ngSubmit)="addTransaction()">
          <div class="form-grid cols-3">
            <mat-form-field appearance="outline">
              <mat-label>Date</mat-label>
              <input matInput type="date" formControlName="date">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Type</mat-label>
              <mat-select formControlName="type">
                <mat-option value="credit">Credit (Money In)</mat-option>
                <mat-option value="debit">Debit (Money Out)</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Transaction Type</mat-label>
              <mat-select formControlName="transactionType">
                <mat-option value="business">Business</mat-option>
                <mat-option value="personal">Personal</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Amount (₹)</mat-label>
              <input matInput type="number" formControlName="amount" placeholder="0">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <input matInput formControlName="description" placeholder="e.g. Cash deposit, bill payment">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Reference (optional)</mat-label>
              <input matInput formControlName="reference" placeholder="UPI/cheque ref">
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-stroked-button type="button" (click)="showTxForm=false" class="btn-outline">Cancel</button>
            <button mat-flat-button type="submit" [disabled]="savingTx" class="btn-primary">
              <mat-icon>add</mat-icon> Add Transaction
            </button>
          </div>
        </form>
      </div>

      <!-- Transactions List -->
      <div *ngIf="!selectedAccount.transactions?.length" class="empty-state" style="padding:24px">
        <mat-icon>receipt</mat-icon><p>No transactions yet</p>
      </div>

      <div class="tx-list" *ngIf="selectedAccount.transactions?.length">
        <div *ngFor="let t of visibleTransactions" class="tx-row">
          <div class="tx-type-icon" [class.credit]="asAny(t).type==='credit'" [class.debit]="asAny(t).type==='debit'">
            <mat-icon>{{ asAny(t).type==='credit' ? 'arrow_downward' : 'arrow_upward' }}</mat-icon>
          </div>
          <div class="tx-info">
            <div class="tx-desc">{{ asAny(t).description || 'No description' }}</div>
            <div class="tx-meta">
              {{ asAny(t).date | date:'dd/MM/yy' }}
              <span class="badge" style="margin-left:6px"
                [class.badge-primary]="asAny(t).transactionType==='business'"
                [class.badge-default]="asAny(t).transactionType==='personal'">
                {{ asAny(t).transactionType | titlecase }}
              </span>
              <span *ngIf="asAny(t).reference" class="text-muted fs-12" style="margin-left:6px">Ref: {{ asAny(t).reference }}</span>
            </div>
          </div>
          <div class="tx-amount" [class.amount-positive]="asAny(t).type==='credit'" [class.amount-negative]="asAny(t).type==='debit'">
            {{ asAny(t).type==='credit' ? '+' : '-' }}₹{{ asAny(t).amount | number:'1.0-2' }}
          </div>
          <button mat-icon-button (click)="deleteTx(asAny(t)._id)" title="Delete" style="color:var(--text-muted)">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
        <div *ngIf="selectedAccount.transactions?.length > 20 && !showAllTx" style="text-align:center;padding:12px">
          <button mat-stroked-button class="btn-outline" (click)="showAllTx=true">
            Show all {{ selectedAccount.transactions?.length }} transactions
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .accounts-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px; }

    .account-card { cursor:pointer;transition:all 0.2s; }
    .account-card.selected { border-color:var(--accent-primary)!important;box-shadow:var(--shadow-glow)!important; }

    .acc-header { display:flex;align-items:flex-start;gap:12px; }
    .acc-icon { width:44px;height:44px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .acc-meta { flex:1;min-width:0; }
    .acc-bank { font-size:15px;font-weight:700;color:var(--text-primary); }
    .acc-name { margin-top:2px; }
    .acc-actions { display:flex;gap:2px; }

    .balance-section { display:flex;align-items:center;gap:12px;padding:8px 0; }
    .balance-item { flex:1;text-align:center; }
    .balance-label { font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px; }
    .balance-val { font-size:16px;font-weight:600;color:var(--text-secondary); }
    .balance-val.current { font-size:20px; }
    .balance-arrow mat-icon { color:var(--text-muted);font-size:18px!important; }

    .acc-stats { display:flex;gap:16px;justify-content:center;padding:8px 0; }
    .acc-stat { display:flex;align-items:center;gap:4px;font-size:13px;font-weight:500; }

    .select-hint { text-align:center;font-size:11px;color:var(--text-muted);margin-top:8px;display:flex;align-items:center;justify-content:center;gap:4px; }
    .select-hint mat-icon { font-size:14px!important; }

    .tx-form-wrap { background:var(--bg-surface);border-radius:var(--radius-md);padding:20px;border:1px solid var(--border); }

    .tx-list { display:flex;flex-direction:column;gap:2px; }
    .tx-row { display:flex;align-items:center;gap:12px;padding:10px 8px;border-radius:var(--radius-sm);transition:background 0.15s; }
    .tx-row:hover { background:var(--bg-card-hover); }
    .tx-type-icon { width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .tx-type-icon.credit { background:rgba(16,185,129,0.15);color:var(--accent-success); }
    .tx-type-icon.debit  { background:rgba(239,68,68,0.15);color:var(--accent-danger); }
    .tx-type-icon mat-icon { font-size:18px!important; }
    .tx-info { flex:1;min-width:0; }
    .tx-desc { font-size:13px;font-weight:500;color:var(--text-primary); }
    .tx-meta { font-size:11px;color:var(--text-muted);margin-top:2px;display:flex;align-items:center; }
    .tx-amount { font-size:14px;font-weight:600;flex-shrink:0;min-width:90px;text-align:right; }
  `]
})
export class BankAccountsComponent implements OnInit {
  accounts: any[] = [];
  selectedAccount: any = null;
  loading = false;
  savingAccount = false;
  savingTx = false;
  showAccountForm = false;
  showTxForm = false;
  showAllTx = false;
  editingAccount: any = null;

  accountForm!: FormGroup;
  txForm!: FormGroup;

  constructor(private api: ApiService, private fb: FormBuilder, private snack: MatSnackBar) {}

  ngOnInit() { this.buildForms(); this.loadAccounts(); }

  buildForms() {
    this.accountForm = this.fb.group({
      bankName: ['', Validators.required],
      accountName: ['', Validators.required],
      accountType: ['savings', Validators.required],
      accountNumber: [''],
      ifscCode: [''],
      openingBalance: [0, Validators.required]
    });

    const today = new Date().toISOString().split('T')[0];
    this.txForm = this.fb.group({
      date: [today, Validators.required],
      type: ['credit', Validators.required],
      transactionType: ['business', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: [''],
      reference: ['']
    });
  }

  loadAccounts() {
    this.loading = true;
    this.api.getBankAccounts().subscribe({
      next: r => {
        this.accounts = r.data || [];
        this.loading = false;
        if (this.selectedAccount) {
          this.selectedAccount = this.accounts.find(a => a._id === this.selectedAccount._id) || null;
        }
      },
      error: () => this.loading = false
    });
  }

  selectAccount(acc: any) {
    this.selectedAccount = this.selectedAccount?._id === acc._id ? null : acc;
    this.showTxForm = false;
    this.showAllTx = false;
  }

  toggleAccountForm() {
    this.showAccountForm = !this.showAccountForm;
    if (!this.showAccountForm) this.cancelAccountForm();
  }

  editAccount(acc: any) {
    this.editingAccount = acc;
    this.accountForm.patchValue({
      bankName: acc.bankName, accountName: acc.accountName,
      accountType: acc.accountType, accountNumber: acc.accountNumber,
      ifscCode: acc.ifscCode, openingBalance: acc.openingBalance
    });
    this.showAccountForm = true;
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelAccountForm() {
    this.editingAccount = null;
    this.showAccountForm = false;
    this.accountForm.reset({ accountType: 'savings', openingBalance: 0 });
  }

  submitAccount() {
    if (this.accountForm.invalid) { this.snack.open('Fill required fields', '', { duration: 3000 }); return; }
    this.savingAccount = true;
    const req = this.editingAccount
      ? this.api.updateBankAccount(this.editingAccount._id, this.accountForm.value)
      : this.api.createBankAccount(this.accountForm.value);
    req.subscribe({
      next: () => {
        this.snack.open(this.editingAccount ? 'Account updated!' : 'Account added!', '', { duration: 2500, panelClass: 'snack-success' });
        this.cancelAccountForm();
        this.loadAccounts();
        this.savingAccount = false;
      },
      error: e => {
        this.snack.open('Error: ' + (e.error?.error || 'Failed'), '', { duration: 3000, panelClass: 'snack-error' });
        this.savingAccount = false;
      }
    });
  }

  deleteAccount(id: string) {
    if (!confirm('Delete this bank account? All transaction history will be lost.')) return;
    this.api.deleteBankAccount(id).subscribe({
      next: () => {
        this.snack.open('Account deleted', '', { duration: 2500 });
        if (this.selectedAccount?._id === id) this.selectedAccount = null;
        this.loadAccounts();
      },
      error: () => this.snack.open('Failed', '', { duration: 3000, panelClass: 'snack-error' })
    });
  }

  addTransaction() {
    if (this.txForm.invalid || !this.selectedAccount) { this.snack.open('Fill all fields', '', { duration: 3000 }); return; }
    this.savingTx = true;
    this.api.addBankTransaction(this.selectedAccount._id, this.txForm.value).subscribe({
      next: (r) => {
        this.snack.open('Transaction added!', '', { duration: 2500, panelClass: 'snack-success' });
        this.showTxForm = false;
        const today = new Date().toISOString().split('T')[0];
        this.txForm.reset({ date: today, type: 'credit', transactionType: 'business' });
        this.loadAccounts();
        this.savingTx = false;
      },
      error: e => {
        this.snack.open('Error: ' + (e.error?.error || 'Failed'), '', { duration: 3000, panelClass: 'snack-error' });
        this.savingTx = false;
      }
    });
  }

  deleteTx(txId: string) {
    if (!confirm('Delete this transaction?')) return;
    this.api.deleteBankTransaction(this.selectedAccount._id, txId).subscribe({
      next: () => { this.snack.open('Deleted', '', { duration: 2000 }); this.loadAccounts(); },
      error: () => this.snack.open('Failed', '', { duration: 3000, panelClass: 'snack-error' })
    });
  }

  totalCredit(acc: any) {
    return (acc.transactions || []).filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + t.amount, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  totalDebit(acc: any) {
    return (acc.transactions || []).filter((t: any) => t.type === 'debit').reduce((s: number, t: any) => s + t.amount, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  bankColor(name: string) {
    const map: any = { sbi: '#0057a8', hdfc: '#004c8f', icici: '#f36f21', axis: '#800000', kotak: '#d32f2f', paytm: '#00b9f5', phonepe: '#5f259f', gpay: '#4285f4' };
    const key = name?.toLowerCase().split(' ')[0];
    return map[key] || '#6366f1';
  }
  get visibleTransactions(): any[] {
    const txs = this.selectedAccount?.transactions || [];
    return this.showAllTx ? txs : txs.slice(0, 20);
  }

  asAny(val: unknown): any { return val; }

}
