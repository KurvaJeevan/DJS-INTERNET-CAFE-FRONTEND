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
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-printers',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <div><div class="page-title">Printers</div><div class="page-subtitle">Manage printers and view analytics</div></div>
      <button mat-flat-button class="btn-primary" (click)="showForm=!showForm">
        <mat-icon>{{ showForm ? 'close' : 'add' }}</mat-icon> {{ showForm ? 'Cancel' : 'Add Printer' }}
      </button>
    </div>

    <!-- ADD/EDIT FORM -->
    <div class="djs-card mb-24" *ngIf="showForm">
      <p class="section-title"><mat-icon>print</mat-icon> {{ editMode ? 'Edit Printer' : 'Add Printer' }}</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-grid cols-3">
          <mat-form-field appearance="outline">
            <mat-label>Printer Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g. HP LaserJet #1">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Model</mat-label>
            <input matInput formControlName="model" placeholder="e.g. HP LaserJet Pro M15w">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Printer Type</mat-label>
            <mat-select formControlName="type">
              <mat-option value="color">Color</mat-option>
              <mat-option value="bw">Black & White</mat-option>
              <mat-option value="both">Both (Color & B&W)</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Ink/Toner Cost (₹ per refill)</mat-label>
            <input matInput type="number" formControlName="inkCost" placeholder="0">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Cartridge Cost (₹)</mat-label>
            <input matInput type="number" formControlName="cartridgeCost" placeholder="0">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Maintenance Cost (₹/month)</mat-label>
            <input matInput type="number" formControlName="maintenanceCost" placeholder="0">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Cost Per B&W Page (₹)</mat-label>
            <input matInput type="number" formControlName="costPerPage" placeholder="0.50">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Cost Per Color Page (₹)</mat-label>
            <input matInput type="number" formControlName="colorCostPerPage" placeholder="2.00">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Notes</mat-label>
            <input matInput formControlName="notes" placeholder="Optional notes">
          </mat-form-field>
        </div>
        <div class="form-actions">
          <button mat-stroked-button type="button" (click)="resetForm()" class="btn-outline">Cancel</button>
          <button mat-flat-button type="submit" [disabled]="saving" class="btn-primary">
            <mat-icon>save</mat-icon> {{ editMode ? 'Update Printer' : 'Save Printer' }}
          </button>
        </div>
      </form>
    </div>

    <!-- PRINTERS GRID -->
    <div *ngIf="loading" class="flex-center" style="height:200px"><mat-spinner diameter="40"></mat-spinner></div>
    <div *ngIf="!loading && !printers.length" class="empty-state djs-card">
      <mat-icon>print_disabled</mat-icon>
      <p>No printers added yet. Add your first printer above.</p>
    </div>

    <div class="printers-grid">
      <div *ngFor="let p of printers" class="printer-card djs-card">
        <!-- Header -->
        <div class="printer-header">
          <div class="printer-icon" [style.background]="typeColor(p.type)+'22'" [style.color]="typeColor(p.type)">
            <mat-icon>print</mat-icon>
          </div>
          <div class="printer-meta">
            <div class="printer-name">{{ p.name }}</div>
            <div class="printer-model text-muted fs-12">{{ p.model }}</div>
            <span class="badge mt-4" [style.background]="typeColor(p.type)+'22'" [style.color]="typeColor(p.type)">
              {{ typeLabel(p.type) }}
            </span>
          </div>
          <div class="printer-actions">
            <button mat-icon-button (click)="editPrinter(p)" title="Edit">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button (click)="deletePrinter(p._id)" title="Delete" style="color:var(--accent-danger)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>

        <div class="djs-divider"></div>

        <!-- Cost Info -->
        <div class="printer-costs">
          <div class="cost-item">
            <span class="cost-label">Ink/Toner</span>
            <span class="cost-value">₹{{ p.inkCost || 0 }}/refill</span>
          </div>
          <div class="cost-item">
            <span class="cost-label">B&W Cost/Page</span>
            <span class="cost-value">₹{{ p.costPerPage || 0 }}</span>
          </div>
          <div class="cost-item" *ngIf="p.type !== 'bw'">
            <span class="cost-label">Color Cost/Page</span>
            <span class="cost-value">₹{{ p.colorCostPerPage || 0 }}</span>
          </div>
          <div class="cost-item">
            <span class="cost-label">Maintenance</span>
            <span class="cost-value">₹{{ p.maintenanceCost || 0 }}/mo</span>
          </div>
        </div>

        <div class="djs-divider"></div>

        <!-- Analytics -->
        <div *ngIf="analytics[p._id]" class="printer-analytics">
          <p class="section-title" style="margin-bottom:12px"><mat-icon>analytics</mat-icon> Performance</p>
          <div class="analytics-grid">
            <div class="analytic-item">
              <div class="analytic-val amount-positive">₹{{ (analytics[p._id]?.totalRevenue||0)|number:'1.0-0' }}</div>
              <div class="analytic-label">Revenue</div>
            </div>
            <div class="analytic-item">
              <div class="analytic-val" [class.amount-positive]="(analytics[p._id]?.totalProfit||0)>=0" [class.amount-negative]="(analytics[p._id]?.totalProfit||0)<0">
                ₹{{ (analytics[p._id]?.totalProfit||0)|number:'1.0-0' }}
              </div>
              <div class="analytic-label">Profit</div>
            </div>
            <div class="analytic-item">
              <div class="analytic-val">{{ analytics[p._id]?.totalPages || 0 }}</div>
              <div class="analytic-label">Total Pages</div>
            </div>
            <div class="analytic-item">
              <div class="analytic-val">{{ analytics[p._id]?.jobCount || 0 }}</div>
              <div class="analytic-label">Jobs</div>
            </div>
          </div>
        </div>
        <div *ngIf="!analytics[p._id]" class="text-muted fs-12" style="text-align:center;padding:8px">
          No transactions recorded yet
        </div>
      </div>
    </div>
  `,
  styles: [`
    .printers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px,1fr)); gap: 20px; }

    .printer-header { display:flex; align-items:flex-start; gap:14px; }
    .printer-icon { width:48px;height:48px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .printer-icon mat-icon { font-size:24px!important; }
    .printer-meta { flex:1;min-width:0; }
    .printer-name { font-size:15px;font-weight:600;color:var(--text-primary); }
    .printer-model { margin-top:2px; }
    .printer-actions { display:flex;gap:4px;margin-left:auto; }

    .printer-costs { display:flex;flex-direction:column;gap:8px; }
    .cost-item { display:flex;justify-content:space-between;align-items:center;font-size:13px; }
    .cost-label { color:var(--text-secondary); }
    .cost-value { color:var(--text-primary);font-weight:500; }

    .analytics-grid { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
    .analytic-item { background:var(--bg-surface);border-radius:var(--radius-sm);padding:10px 14px;text-align:center; }
    .analytic-val { font-size:16px;font-weight:700;color:var(--text-primary); }
    .analytic-label { font-size:11px;color:var(--text-muted);margin-top:2px;text-transform:uppercase;letter-spacing:0.04em; }
  `]
})
export class PrintersComponent implements OnInit {
  form!: FormGroup;
  printers: any[] = [];
  analytics: any = {};
  loading = false;
  saving = false;
  showForm = false;
  editMode = false;
  editId = '';

  constructor(private api: ApiService, private fb: FormBuilder, private snack: MatSnackBar) {}

  ngOnInit() { this.buildForm(); this.loadPrinters(); }

  buildForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      model: ['', Validators.required],
      type: ['bw', Validators.required],
      inkCost: [0], cartridgeCost: [0], maintenanceCost: [0],
      costPerPage: [0], colorCostPerPage: [0], notes: ['']
    });
  }

  loadPrinters() {
    this.loading = true;
    this.api.getPrinters().subscribe({
      next: r => {
        this.printers = r.data || [];
        this.loading = false;
        this.printers.forEach(p => this.loadAnalytics(p._id));
      },
      error: () => this.loading = false
    });
  }

  loadAnalytics(id: string) {
    this.api.getPrinterAnalytics(id).subscribe({
      next: r => { this.analytics[id] = r.data; },
      error: () => {}
    });
  }

  submit() {
    if (this.form.invalid) { this.snack.open('Fill required fields','',{duration:3000}); return; }
    this.saving = true;
    const req = this.editMode
      ? this.api.updatePrinter(this.editId, this.form.value)
      : this.api.createPrinter(this.form.value);
    req.subscribe({
      next: () => {
        this.snack.open(this.editMode?'Updated!':'Printer added!','',{duration:2500,panelClass:'snack-success'});
        this.resetForm(); this.loadPrinters(); this.saving=false;
      },
      error: e => { this.snack.open('Error: '+(e.error?.error||'Failed'),'',{duration:3000,panelClass:'snack-error'}); this.saving=false; }
    });
  }

  editPrinter(p: any) {
    this.editMode=true; this.editId=p._id;
    this.form.patchValue(p);
    this.showForm=true;
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deletePrinter(id: string) {
    if (!confirm('Delete this printer?')) return;
    this.api.deletePrinter(id).subscribe({
      next: () => { this.snack.open('Deleted','',{duration:2000}); this.loadPrinters(); },
      error: () => this.snack.open('Failed','',{duration:3000,panelClass:'snack-error'})
    });
  }

  resetForm() { this.editMode=false; this.editId=''; this.showForm=false; this.buildForm(); }
  typeLabel(t: string) { return t==='color'?'Color':t==='bw'?'B&W':'Color & B&W'; }
  typeColor(t: string) { return t==='color'?'#ec4899':t==='bw'?'#6366f1':'#10b981'; }
}
