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
import { MatTableModule } from '@angular/material/table';
import { TitleCasePipe, DecimalPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule, MatTableModule,
    TitleCasePipe, DecimalPipe, DatePipe
  ],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Expenses</div>
        <div class="page-subtitle">Track all business expenses</div>
      </div>
    </div>

    <!-- ADD EXPENSE FORM -->
    <div class="djs-card mb-24">
      <p class="section-title"><mat-icon>add_circle</mat-icon> {{ editMode ? 'Edit Expense' : 'Add Expense' }}</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-grid cols-3">
          <mat-form-field appearance="outline">
            <mat-label>Date</mat-label>
            <input matInput type="date" formControlName="date">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Expense Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g. Black ink cartridge">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="category">
              <mat-option *ngFor="let c of categories" [value]="c.value">{{ c.label }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Amount (₹)</mat-label>
            <input matInput type="number" formControlName="amount" placeholder="0">
          </mat-form-field>
          <mat-form-field appearance="outline" style="grid-column: span 2">
            <mat-label>Notes (optional)</mat-label>
            <input matInput formControlName="notes" placeholder="Additional details...">
          </mat-form-field>
        </div>
        <div class="form-actions">
          <button mat-stroked-button type="button" (click)="resetForm()" class="btn-outline">Clear</button>
          <button mat-flat-button type="submit" [disabled]="saving" class="btn-primary">
            <mat-icon>{{ saving ? 'hourglass_empty' : 'add' }}</mat-icon>
            {{ editMode ? 'Update Expense' : 'Add Expense' }}
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
        <mat-form-field appearance="outline" style="max-width:160px">
          <mat-label>Category</mat-label>
          <mat-select [(ngModel)]="filterCategory">
            <mat-option value="">All Categories</mat-option>
            <mat-option *ngFor="let c of categories" [value]="c.value">{{ c.label }}</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-flat-button class="btn-primary" (click)="filterExp()"><mat-icon>filter_list</mat-icon> Filter</button>
        <button mat-stroked-button class="btn-outline" (click)="loadToday()">Today</button>
        <div class="summary-chip" *ngIf="expenses.length">
          <mat-icon>remove_circle</mat-icon> Total: <strong class="amount-negative">₹{{ total }}</strong>
        </div>
      </div>
    </div>

    <!-- EXPENSES TABLE -->
    <div class="djs-card">
      <p class="section-title"><mat-icon>list</mat-icon> Expenses ({{ expenses.length }})</p>

      <div *ngIf="loading" class="flex-center" style="padding:32px"><mat-spinner diameter="36"></mat-spinner></div>
      <div *ngIf="!loading && !expenses.length" class="empty-state">
        <mat-icon>shopping_cart</mat-icon><p>No expenses found</p>
      </div>

      <div *ngIf="!loading && expenses.length" class="table-container">
        <table mat-table [dataSource]="expenses">
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let e">{{ e.date | date:'dd/MM/yyyy' }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Expense</th>
            <td mat-cell *matCellDef="let e">{{ e.name }}</td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let e">
              <span class="badge" [style.background]="catColor(e.category)+'22'" [style.color]="catColor(e.category)">
                {{ catLabel(e.category) }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let e" class="amount-negative">₹{{ e.amount | number:'1.0-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="notes">
            <th mat-header-cell *matHeaderCellDef>Notes</th>
            <td mat-cell *matCellDef="let e" class="text-muted">{{ e.notes || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let e">
              <button mat-icon-button (click)="editExp(e)" title="Edit"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button (click)="deleteExp(e._id)" title="Delete" style="color:var(--accent-danger)"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .summary-chip { display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);margin-left:auto;padding:6px 12px;background:var(--bg-surface);border-radius:var(--radius-sm); }
    .summary-chip mat-icon { font-size:16px!important;color:var(--accent-danger); }
  `]
})
export class ExpensesComponent implements OnInit {
  form!: FormGroup;
  expenses: any[] = [];
  loading = false;
  saving = false;
  editMode = false;
  editId = '';
  filterStart = '';
  filterEnd = '';
  filterCategory = '';
  cols = ['date','name','category','amount','notes','actions'];

  categories = [
    { value:'ink',label:'Ink/Toner',color:'#6366f1' },
    { value:'paper',label:'Paper',color:'#3b82f6' },
    { value:'electricity',label:'Electricity',color:'#f59e0b' },
    { value:'internet',label:'Internet',color:'#10b981' },
    { value:'repairs',label:'Repairs',color:'#ef4444' },
    { value:'maintenance',label:'Maintenance',color:'#8b5cf6' },
    { value:'salary',label:'Salary',color:'#ec4899' },
    { value:'rent',label:'Rent',color:'#f97316' },
    { value:'other',label:'Other',color:'#94a3b8' }
  ];

  constructor(private api: ApiService, private fb: FormBuilder, private snack: MatSnackBar) {}

  ngOnInit() { this.buildForm(); this.loadToday(); }

  buildForm() {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      date: [today, Validators.required],
      name: ['', Validators.required],
      category: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  get total() { return this.expenses.reduce((s,e)=>s+e.amount,0).toLocaleString('en-IN'); }

  loadToday() {
    this.loading = true;
    this.api.getExpenses({ date: 'today' }).subscribe({
      next: r => { this.expenses = r.data || []; this.loading = false; },
      error: () => this.loading = false
    });
  }

  filterExp() {
    const p: any = {};
    if (this.filterStart) p.startDate = this.filterStart;
    if (this.filterEnd)   p.endDate   = this.filterEnd;
    if (this.filterCategory) p.category = this.filterCategory;
    this.loading = true;
    this.api.getExpenses(p).subscribe({
      next: r => { this.expenses = r.data || []; this.loading = false; },
      error: () => this.loading = false
    });
  }

  submit() {
    if (this.form.invalid) { this.snack.open('Fill required fields', '', { duration: 3000 }); return; }
    this.saving = true;
    const req = this.editMode
      ? this.api.updateExpense(this.editId, this.form.value)
      : this.api.createExpense(this.form.value);
    req.subscribe({
      next: () => {
        this.snack.open(this.editMode ? 'Updated!' : 'Expense added!', '', { duration: 2500, panelClass:'snack-success' });
        this.resetForm(); this.loadToday(); this.saving = false;
      },
      error: e => { this.snack.open('Error: '+(e.error?.error||'Failed'), '', { duration:3000, panelClass:'snack-error' }); this.saving=false; }
    });
  }

  editExp(e: any) {
    this.editMode = true; this.editId = e._id;
    this.form.patchValue({ ...e, date: new Date(e.date).toISOString().split('T')[0] });
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteExp(id: string) {
    if (!confirm('Delete this expense?')) return;
    this.api.deleteExpense(id).subscribe({
      next: () => { this.snack.open('Deleted','',{duration:2000}); this.loadToday(); },
      error: () => this.snack.open('Failed','',{duration:3000,panelClass:'snack-error'})
    });
  }

  resetForm() { this.editMode=false; this.editId=''; this.buildForm(); }
  catLabel(v: string) { return this.categories.find(c=>c.value===v)?.label||v; }
  catColor(v: string) { return this.categories.find(c=>c.value===v)?.color||'#94a3b8'; }
}
