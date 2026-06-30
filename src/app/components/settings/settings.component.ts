import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DatePipe,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Settings</div>
        <div class="page-subtitle">Appearance, account, and team management</div>
      </div>
    </div>

    <div class="grid-2 mb-24">
      <!-- APPEARANCE -->
      <div class="djs-card">
        <p class="section-title"><mat-icon>palette</mat-icon> Appearance</p>
        <div class="theme-row">
          <div>
            <div class="setting-label">Theme</div>
            <div class="setting-desc">Choose how DJS Cafe looks on your screen</div>
          </div>
          <div class="theme-options">
            <button class="theme-option" [class.active]="theme.mode()==='dark'" (click)="theme.set('dark')">
              <mat-icon>dark_mode</mat-icon> Dark
            </button>
            <button class="theme-option" [class.active]="theme.mode()==='light'" (click)="theme.set('light')">
              <mat-icon>light_mode</mat-icon> Light
            </button>
          </div>
        </div>
      </div>

      <!-- ACCOUNT -->
      <div class="djs-card">
        <p class="section-title"><mat-icon>account_circle</mat-icon> Your Account</p>
        <div class="account-info">
          <div class="account-avatar">{{ initial }}</div>
          <div>
            <div class="account-name">{{ user()?.name }}</div>
            <div class="account-meta">{{ '@' + user()?.username }} &nbsp;·&nbsp; <span class="badge badge-primary">{{ user()?.role | titlecase }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- CHANGE PASSWORD -->
    <div class="djs-card mb-24">
      <p class="section-title"><mat-icon>lock_reset</mat-icon> Change Password</p>
      <form [formGroup]="pwForm" (ngSubmit)="changePassword()">
        <div class="form-grid cols-3">
          <mat-form-field appearance="outline">
            <mat-label>Current Password</mat-label>
            <input matInput type="password" formControlName="currentPassword">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>New Password</mat-label>
            <input matInput type="password" formControlName="newPassword">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Confirm New Password</mat-label>
            <input matInput type="password" formControlName="confirmPassword">
          </mat-form-field>
        </div>
        <div class="form-actions">
          <button mat-flat-button type="submit" class="btn-primary" [disabled]="pwSaving">
            <mat-icon>save</mat-icon> Update Password
          </button>
        </div>
      </form>
    </div>

    <!-- TEAM MANAGEMENT (admin only) -->
    <div class="djs-card" *ngIf="isAdmin">
      <div class="flex-between mb-16">
        <p class="section-title" style="margin-bottom:0"><mat-icon>group</mat-icon> Team Accounts</p>
        <button mat-flat-button class="btn-primary" (click)="showUserForm = !showUserForm">
          <mat-icon>{{ showUserForm ? 'close' : 'person_add' }}</mat-icon>
          {{ showUserForm ? 'Cancel' : 'Add Staff Account' }}
        </button>
      </div>

      <div *ngIf="showUserForm" class="user-form-wrap mb-16">
        <form [formGroup]="userForm" (ngSubmit)="createUser()">
          <div class="form-grid cols-3">
            <mat-form-field appearance="outline">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="name">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Role</mat-label>
              <mat-select formControlName="role">
                <mat-option value="staff">Staff</mat-option>
                <mat-option value="admin">Admin</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-flat-button type="submit" class="btn-primary" [disabled]="userSaving">
              <mat-icon>add</mat-icon> Create Account
            </button>
          </div>
        </form>
      </div>

      <div *ngIf="loadingUsers" class="flex-center" style="padding:24px"><mat-spinner diameter="32"></mat-spinner></div>

      <div *ngIf="!loadingUsers" class="users-list">
        <div *ngFor="let u of users" class="user-row">
          <div class="account-avatar small">{{ u.name?.charAt(0)?.toUpperCase() }}</div>
          <div class="user-info">
            <div class="user-name">{{ u.name }}</div>
            <div class="user-meta">
              {{ '@' + u.username }}
              <span class="badge" [class.badge-primary]="u.role==='admin'" [class.badge-default]="u.role==='staff'" style="margin-left:6px">{{ u.role | titlecase }}</span>
              <span *ngIf="u.lastLoginAt" class="text-muted fs-12"> &nbsp;· Last login {{ u.lastLoginAt | date:'dd MMM, h:mm a' }}</span>
              <span *ngIf="!u.lastLoginAt" class="text-muted fs-12"> &nbsp;· Never logged in</span>
            </div>
          </div>
          <span class="badge" [class.badge-success]="u.isActive" [class.badge-danger]="!u.isActive">
            {{ u.isActive ? 'Active' : 'Disabled' }}
          </span>
         
        </div>
      </div>
    </div>
  `,
  styles: [`
    .theme-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .setting-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .setting-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

    .theme-options { display: flex; gap: 8px; }
    .theme-option {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: var(--radius-md);
      border: 1px solid var(--border); background: var(--bg-surface);
      color: var(--text-secondary); font-size: 13px; font-weight: 500;
      cursor: pointer; transition: all 0.2s;
    }
    .theme-option mat-icon { font-size: 16px !important; width: 16px; height: 16px; }
    .theme-option:hover { border-color: var(--border-hover); }
    .theme-option.active { background: var(--accent-glow); border-color: var(--accent-primary); color: var(--accent-primary); }

    .account-info { display: flex; align-items: center; gap: 14px; }
    .account-avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: var(--accent-glow); color: var(--accent-primary);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 18px; flex-shrink: 0;
    }
    .account-avatar.small { width: 36px; height: 36px; font-size: 14px; }
    .account-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .account-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

    .user-form-wrap { background: var(--bg-surface); border-radius: var(--radius-md); padding: 20px; border: 1px solid var(--border); }

    .users-list { display: flex; flex-direction: column; gap: 2px; }
    .user-row { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: var(--radius-sm); }
    .user-row:hover { background: var(--bg-card-hover); }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
    .user-meta { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  `]
})
export class SettingsComponent implements OnInit {
  pwForm!: FormGroup;
  userForm!: FormGroup;
  pwSaving = false;
  userSaving = false;
  showUserForm = false;
  users: any[] = [];
  loadingUsers = false;

  constructor(
    public theme: ThemeService,
    private auth: AuthService,
    private fb: FormBuilder,
    private snack: MatSnackBar
  ) {}

  get user() { return this.auth.currentUser; }
  get isAdmin() { return this.auth.currentUser()?.role === 'admin'; }
  get currentUserId() { return this.auth.currentUser()?._id; }
  get initial() { return this.user()?.name?.charAt(0)?.toUpperCase() || '?'; }

  ngOnInit() {
    this.pwForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });

    this.userForm = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['staff', Validators.required]
    });

    if (this.isAdmin) this.loadUsers();
  }

  changePassword() {
    if (this.pwForm.invalid) {
      this.snack.open('Fill all password fields (min 6 characters)', '', { duration: 3000 });
      return;
    }
    const v = this.pwForm.value;
    if (v.newPassword !== v.confirmPassword) {
      this.snack.open('New passwords do not match', '', { duration: 3000 });
      return;
    }
    this.pwSaving = true;
    this.auth.changePassword(v.currentPassword, v.newPassword).subscribe({
      next: () => {
        this.snack.open('Password updated successfully!', '', { duration: 3000, panelClass: 'snack-success' });
        this.pwForm.reset();
        this.pwSaving = false;
      },
      error: e => {
        this.snack.open('Error: ' + (e.error?.error || 'Failed'), '', { duration: 4000, panelClass: 'snack-error' });
        this.pwSaving = false;
      }
    });
  }

  loadUsers() {
    this.loadingUsers = true;
    this.auth.listUsers().subscribe({
      next: r => { this.users = r.data || []; this.loadingUsers = false; },
      error: () => this.loadingUsers = false
    });
  }

  createUser() {
    if (this.userForm.invalid) {
      this.snack.open('Fill all fields (password min 6 characters)', '', { duration: 3000 });
      return;
    }
    this.userSaving = true;
    this.auth.createUser(this.userForm.value).subscribe({
      next: () => {
        this.snack.open('Staff account created!', '', { duration: 3000, panelClass: 'snack-success' });
        this.userForm.reset({ role: 'staff' });
        this.showUserForm = false;
        this.userSaving = false;
        this.loadUsers();
      },
      error: e => {
        this.snack.open('Error: ' + (e.error?.error || 'Failed'), '', { duration: 4000, panelClass: 'snack-error' });
        this.userSaving = false;
      }
    });
  }

  toggleActive(u: any) {
    this.auth.updateUser(u._id, { isActive: !u.isActive }).subscribe({
      next: () => { u.isActive = !u.isActive; this.snack.open(u.isActive ? 'Account enabled' : 'Account disabled', '', { duration: 2500 }); },
      error: () => this.snack.open('Failed to update', '', { duration: 3000, panelClass: 'snack-error' })
    });
  }

  deleteUser(u: any) {
    if (u._id === this.currentUserId) return;
    if (!confirm(`Delete account "${u.name}"? This cannot be undone.`)) return;
    this.auth.deleteUser(u._id).subscribe({
      next: () => { this.snack.open('Account deleted', '', { duration: 2500 }); this.loadUsers(); },
      error: () => this.snack.open('Failed to delete', '', { duration: 3000, panelClass: 'snack-error' })
    });
  }
}
