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
import { MatExpansionModule } from '@angular/material/expansion';
import { SlicePipe, TitleCasePipe, DecimalPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-pan-applications',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatTableModule, MatExpansionModule, SlicePipe, TitleCasePipe, DecimalPipe, DatePipe
  ],
  template: `
    <div class="page-header">
      <div><div class="page-title">PAN Applications</div><div class="page-subtitle">Track PAN card applications — no more WhatsApp searching</div></div>
      <button mat-flat-button class="btn-primary" (click)="toggleForm()">
        <mat-icon>{{ showForm ? 'close' : 'add' }}</mat-icon>
        {{ showForm ? 'Cancel' : (editMode ? 'Edit Application' : 'Add Application') }}
      </button>
    </div>

    <!-- OFFLINE PDF EXTRACTION SECTION -->
    <div class="djs-card mb-16" *ngIf="showForm && !editMode">
      <p class="section-title"><mat-icon>upload_file</mat-icon> Upload PAN Acknowledgement PDF (Auto-Extract)</p>
      <div class="upload-zone" (dragover)="$event.preventDefault()" (drop)="onDrop($event)"
           (click)="fileInput.click()" [class.extracting]="extracting">
        <input #fileInput type="file" accept=".pdf" style="display:none" (change)="onFileSelect($event)">
        <mat-icon class="upload-icon">{{ extracting ? 'hourglass_empty' : 'cloud_upload' }}</mat-icon>
        <div *ngIf="!extracting">
          <p class="upload-title">Drop the PAN acknowledgement PDF here, or click to browse</p>
          <p class="upload-sub">Extraction runs fully offline — no internet or AI needed. PDF only.</p>
        </div>
        <div *ngIf="extracting">
          <p class="upload-title">Reading PDF and extracting fields...</p>
          <p class="upload-sub">This is instant — just a moment</p>
        </div>
      </div>
      <p class="text-muted fs-12 mt-16" style="text-align:center">
        <mat-icon style="font-size:14px!important;vertical-align:middle">info</mat-icon>
        The PDF is read in memory for extraction only — it is NOT saved to the database or disk.
      </p>
    </div>

    <!-- ADD / EDIT FORM -->
    <div class="djs-card mb-24" *ngIf="showForm">
      <p class="section-title"><mat-icon>badge</mat-icon> {{ editMode ? 'Edit PAN Application' : 'PAN Application Details' }}</p>
      <p class="text-muted fs-12 mb-16" *ngIf="!editMode">Review extracted data below and confirm before saving.</p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <!-- Personal Details -->
        <div class="form-section-label">Personal Details</div>
        <div class="form-grid cols-3">
          <mat-form-field appearance="outline">
            <mat-label>Applicant Name *</mat-label>
            <input matInput formControlName="applicantName">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Gender</mat-label>
            <mat-select formControlName="gender">
              <mat-option value="">Not specified</mat-option>
              <mat-option value="Male">Male</mat-option>
              <mat-option value="Female">Female</mat-option>
              <mat-option value="Other">Other</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Date of Birth</mat-label>
            <input matInput formControlName="dateOfBirth" placeholder="DD/MM/YYYY">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Father's Name</mat-label>
            <input matInput formControlName="fatherName">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Mobile Number</mat-label>
            <input matInput formControlName="mobileNumber" placeholder="9876543210">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Aadhaar Number (masked)</mat-label>
            <input matInput formControlName="aadhaarNumber" placeholder="XXXX XXXX 1234">
          </mat-form-field>
          <mat-form-field appearance="outline" style="grid-column:span 2">
            <mat-label>Address</mat-label>
            <input matInput formControlName="address">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>State</mat-label>
            <input matInput formControlName="state">
          </mat-form-field>
        </div>

        <!-- PAN & Application Details -->
        <div class="form-section-label mt-16">Application Details</div>
        <div class="form-grid cols-3">
          <mat-form-field appearance="outline">
            <mat-label>Application Number</mat-label>
            <input matInput formControlName="applicationNumber" placeholder="Acknowledgement No.">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>PAN Number (if issued)</mat-label>
            <input matInput formControlName="panNumber" placeholder="ABCDE1234F">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Application Date</mat-label>
            <input matInput formControlName="applicationDate" placeholder="DD/MM/YYYY">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>PAN Card Mode</mat-label>
            <mat-select formControlName="panCardMode">
              <mat-option value="">Unknown</mat-option>
              <mat-option value="Physical">Physical</mat-option>
              <mat-option value="e-PAN">e-PAN</mat-option>
              <mat-option value="Both">Both</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Proof Details</mat-label>
            <input matInput formControlName="proofDetails" placeholder="Aadhaar / Passport / etc.">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Application Status</mat-label>
            <mat-select formControlName="status">
              <mat-option *ngFor="let s of statuses" [value]="s.value">{{ s.label }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Payment Details -->
        <div class="form-section-label mt-16">Payment Details</div>
        <div class="form-grid cols-3">
          <mat-form-field appearance="outline">
            <mat-label>Payment Reference</mat-label>
            <input matInput formControlName="paymentReference">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Payment Date</mat-label>
            <input matInput formControlName="paymentDate" placeholder="DD/MM/YYYY">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Amount Paid (₹)</mat-label>
            <input matInput type="number" formControlName="amountPaid">
          </mat-form-field>
          <mat-form-field appearance="outline" style="grid-column:span 3">
            <mat-label>Notes</mat-label>
            <input matInput formControlName="notes" placeholder="Any additional notes...">
          </mat-form-field>
        </div>

        <div class="form-actions">
          <button mat-stroked-button type="button" (click)="cancelForm()" class="btn-outline">Cancel</button>
          <button mat-flat-button type="submit" [disabled]="saving" class="btn-primary">
            <mat-icon>save</mat-icon> {{ editMode ? 'Update Application' : 'Save Application' }}
          </button>
        </div>
      </form>
    </div>

    <!-- SEARCH & FILTER -->
    <div class="djs-card mb-16">
      <div class="search-bar">
        <mat-form-field appearance="outline" style="flex:1;min-width:200px">
          <mat-label>Search by name, mobile, application no.</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Type to search...">
        </mat-form-field>
        <mat-form-field appearance="outline" style="max-width:160px">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="filterStatus" (selectionChange)="onSearch()">
            <mat-option value="">All Status</mat-option>
            <mat-option *ngFor="let s of statuses" [value]="s.value">{{ s.label }}</mat-option>
          </mat-select>
        </mat-form-field>
        <div class="summary-chips">
          <span *ngFor="let s of statuses" class="status-count-chip" (click)="filterByStatus(s.value)"
                [style.background]="statusColor(s.value)+'22'" [style.color]="statusColor(s.value)"
                [style.border]="'1px solid '+statusColor(s.value)+'44'">
            {{ s.label }}: {{ countByStatus(s.value) }}
          </span>
        </div>
      </div>
    </div>

    <!-- APPLICATIONS LIST -->
    <div *ngIf="loading" class="flex-center" style="height:200px"><mat-spinner diameter="40"></mat-spinner></div>
    <div *ngIf="!loading && !applications.length" class="empty-state djs-card">
      <mat-icon>badge</mat-icon><p>No PAN applications found</p>
    </div>

    <div class="pan-list">
      <mat-expansion-panel *ngFor="let app of applications" class="pan-panel">
        <mat-expansion-panel-header>
          <div class="pan-header">
            <div class="pan-avatar">{{ app.applicantName?.charAt(0)?.toUpperCase() || 'P' }}</div>
            <div class="pan-summary">
              <div class="pan-name">{{ app.applicantName }}</div>
              <div class="pan-meta">
                {{ app.applicationNumber || 'No App No.' }}
                <span *ngIf="app.mobileNumber"> · {{ app.mobileNumber }}</span>
                <span *ngIf="app.applicationDate"> · {{ app.applicationDate }}</span>
              </div>
            </div>
            <div class="pan-right">
              <span class="badge" [style.background]="statusColor(app.status)+'22'" [style.color]="statusColor(app.status)">
                {{ statusLabel(app.status) }}
              </span>
              <div class="pan-actions" (click)="$event.stopPropagation()">
                <button mat-icon-button (click)="editApp(app)" title="Edit"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button (click)="deleteApp(app._id)" title="Delete" style="color:var(--accent-danger)"><mat-icon>delete</mat-icon></button>
              </div>
            </div>
          </div>
        </mat-expansion-panel-header>

        <!-- Expanded Details -->
        <div class="pan-details">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">PAN Number</span><span class="detail-val">{{ app.panNumber || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Gender</span><span class="detail-val">{{ app.gender || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Date of Birth</span><span class="detail-val">{{ app.dateOfBirth || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Father's Name</span><span class="detail-val">{{ app.fatherName || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Aadhaar</span><span class="detail-val">{{ app.aadhaarNumber || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Email</span><span class="detail-val">{{ app.email || '—' }}</span></div>
            <div class="detail-item" style="grid-column:span 2"><span class="detail-label">Address</span><span class="detail-val">{{ app.address || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">State</span><span class="detail-val">{{ app.state || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Proof</span><span class="detail-val">{{ app.proofDetails || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">PAN Mode</span><span class="detail-val">{{ app.panCardMode || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Payment Ref</span><span class="detail-val">{{ app.paymentReference || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Payment Date</span><span class="detail-val">{{ app.paymentDate || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Amount Paid</span><span class="detail-val amount-positive">₹{{ app.amountPaid || 0 }}</span></div>
          </div>
          <div class="detail-item mt-16" *ngIf="app.notes"><span class="detail-label">Notes</span><span class="detail-val">{{ app.notes }}</span></div>

          <!-- Status Update -->
          <div class="status-update mt-16">
            <p class="section-title" style="margin-bottom:10px"><mat-icon>update</mat-icon> Update Status</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button *ngFor="let s of statuses" mat-stroked-button
                      [class.btn-primary]="app.status===s.value"
                      [class.btn-outline]="app.status!==s.value"
                      (click)="updateStatus(app, s.value)"
                      [style.border-color]="statusColor(s.value)"
                      [style.color]="app.status===s.value?'#fff':statusColor(s.value)">
                {{ s.label }}
              </button>
            </div>
          </div>
        </div>
      </mat-expansion-panel>
    </div>
  `,
  styles: [`
    .form-section-label { font-size:12px;font-weight:600;color:var(--accent-primary);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;margin-top:4px; }

    .upload-zone {
      border: 2px dashed var(--border-hover); border-radius:var(--radius-lg);
      padding: 40px; text-align:center; cursor:pointer; transition:all 0.2s;
    }
    .upload-zone:hover { border-color:var(--accent-primary); background:rgba(99,102,241,0.05); }
    .upload-zone.extracting { border-color:var(--accent-warn); background:rgba(245,158,11,0.05); }
    .upload-icon { font-size:48px!important;width:48px;height:48px;color:var(--accent-primary);margin-bottom:12px;opacity:0.7; }
    .upload-title { font-size:14px;font-weight:500;color:var(--text-primary); }
    .upload-sub { font-size:12px;color:var(--text-muted);margin-top:4px; }

    .summary-chips { display:flex;flex-wrap:wrap;gap:6px; }
    .status-count-chip { padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s; }
    .status-count-chip:hover { opacity:0.8; }

    .pan-list { display:flex;flex-direction:column;gap:8px; }
    .pan-panel { background:var(--bg-card)!important;border:1px solid var(--border)!important;border-radius:var(--radius-md)!important; }
    .pan-panel ::ng-deep .mat-expansion-panel-header { padding:16px 20px; }
    .pan-panel ::ng-deep .mat-expansion-panel-body { padding:0 20px 20px; }

    .pan-header { display:flex;align-items:center;gap:12px;width:100%; }
    .pan-avatar { width:36px;height:36px;border-radius:50%;background:rgba(99,102,241,0.2);color:var(--accent-primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0; }
    .pan-summary { flex:1;min-width:0; }
    .pan-name { font-size:14px;font-weight:600;color:var(--text-primary); }
    .pan-meta { font-size:11px;color:var(--text-muted);margin-top:2px; }
    .pan-right { display:flex;align-items:center;gap:8px;margin-left:auto;flex-shrink:0; }
    .pan-actions { display:flex;gap:2px; }

    .pan-details { padding-top:16px;border-top:1px solid var(--border); }
    .detail-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:12px; }
    .detail-item { display:flex;flex-direction:column;gap:2px; }
    .detail-label { font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em; }
    .detail-val { font-size:13px;color:var(--text-primary);font-weight:500; }

    .status-update {}
    .summary-chip { display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);margin-left:auto;padding:6px 12px;background:var(--bg-surface);border-radius:var(--radius-sm); }

    @media (max-width:768px) { .detail-grid { grid-template-columns:1fr 1fr; } }
  `]
})
export class PanApplicationsComponent implements OnInit {
  form!: FormGroup;
  applications: any[] = [];
  allApplications: any[] = [];
  loading = false;
  saving = false;
  showForm = false;
  editMode = false;
  editId = '';
  extracting = false;
  searchQuery = '';
  filterStatus = '';

  statuses = [
    { value: 'submitted',  label: 'Submitted' },
    { value: 'processing', label: 'Processing' },
    { value: 'approved',   label: 'Approved' },
    { value: 'delivered',  label: 'Delivered' },
    { value: 'rejected',   label: 'Rejected' }
  ];

  constructor(private api: ApiService, private fb: FormBuilder, private snack: MatSnackBar) {}

  ngOnInit() { this.buildForm(); this.loadApplications(); }

  buildForm() {
    this.form = this.fb.group({
      applicantName: ['', Validators.required],
      applicationNumber: [''], panNumber: [''], gender: [''],
      dateOfBirth: [''], fatherName: [''], aadhaarNumber: [''],
      mobileNumber: [''], email: [''], address: [''], state: [''],
      proofDetails: [''], applicationDate: [''], paymentReference: [''],
      paymentDate: [''], amountPaid: [0], panCardMode: [''],
      status: ['submitted'], notes: ['']
    });
  }

  loadApplications() {
    this.loading = true;
    const params: any = {};
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.searchQuery)  params.search = this.searchQuery;
    this.api.getPanApplications(params).subscribe({
      next: r => { this.allApplications = r.data || []; this.applications = this.allApplications; this.loading = false; },
      error: () => this.loading = false
    });
  }

  onSearch() {
    const q = this.searchQuery.toLowerCase();
    this.applications = this.allApplications.filter(a => {
      const matchSearch = !q ||
        a.applicantName?.toLowerCase().includes(q) ||
        a.applicationNumber?.toLowerCase().includes(q) ||
        a.mobileNumber?.includes(q) ||
        a.panNumber?.toLowerCase().includes(q);
      const matchStatus = !this.filterStatus || a.status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  filterByStatus(status: string) {
    this.filterStatus = this.filterStatus === status ? '' : status;
    this.onSearch();
  }

  countByStatus(status: string) { return this.allApplications.filter(a => a.status === status).length; }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) this.extractFromFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.extractFromFile(file);
  }

  extractFromFile(file: File) {
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      this.snack.open('Please upload a PDF acknowledgement receipt', '', { duration: 3000, panelClass: 'snack-error' });
      return;
    }

    this.extracting = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      const mediaType = file.type || 'application/pdf';

      // Calls backend which parses the PDF text offline via regex — no AI/API involved
      this.api.extractPanDocument(base64, mediaType).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.form.patchValue(res.data);
            this.snack.open('Data extracted from PDF! Review and save.', '', { duration: 4000, panelClass: 'snack-success' });
          } else {
            this.snack.open('Could not extract — please fill manually', '', { duration: 3000 });
          }
          this.extracting = false;
        },
        error: (e) => {
          const msg = e.error?.error || 'Extraction failed';
          this.snack.open(msg, '', { duration: 5000, panelClass: 'snack-error' });
          this.extracting = false;
        }
      });
    };
    reader.readAsDataURL(file);
  }

  toggleForm() { this.showForm = !this.showForm; if (!this.showForm) this.cancelForm(); }

  submit() {
    if (this.form.invalid) { this.snack.open('Applicant name is required', '', { duration: 3000 }); return; }
    this.saving = true;
    const req = this.editMode
      ? this.api.updatePanApplication(this.editId, this.form.value)
      : this.api.createPanApplication(this.form.value);
    req.subscribe({
      next: () => {
        this.snack.open(this.editMode ? 'Updated!' : 'Application saved!', '', { duration: 2500, panelClass: 'snack-success' });
        this.cancelForm(); this.loadApplications(); this.saving = false;
      },
      error: e => {
        this.snack.open('Error: ' + (e.error?.error || 'Failed'), '', { duration: 3000, panelClass: 'snack-error' });
        this.saving = false;
      }
    });
  }

  editApp(app: any) {
    this.editMode = true; this.editId = app._id;
    this.form.patchValue(app);
    this.showForm = true;
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteApp(id: string) {
    if (!confirm('Delete this PAN application?')) return;
    this.api.deletePanApplication(id).subscribe({
      next: () => { this.snack.open('Deleted', '', { duration: 2000 }); this.loadApplications(); },
      error: () => this.snack.open('Failed', '', { duration: 3000, panelClass: 'snack-error' })
    });
  }

  updateStatus(app: any, status: string) {
    this.api.updatePanStatus(app._id, { status }).subscribe({
      next: () => { app.status = status; this.snack.open('Status updated!', '', { duration: 2000, panelClass: 'snack-success' }); },
      error: () => this.snack.open('Failed', '', { duration: 3000, panelClass: 'snack-error' })
    });
  }

  cancelForm() { this.editMode = false; this.editId = ''; this.showForm = false; this.buildForm(); }

  statusLabel(v: string) { return this.statuses.find(s => s.value === v)?.label || v; }
  statusColor(v: string) {
    const map: any = { submitted:'#6366f1', processing:'#f59e0b', approved:'#10b981', delivered:'#3b82f6', rejected:'#ef4444' };
    return map[v] || '#94a3b8';
  }
}
