import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },

  // ── Public routes ──
  {
    path: 'landing',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },

  // ── Protected routes (require login) ──
  { path: 'home',             canActivate: [authGuard], loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
  { path: 'dashboard',        canActivate: [authGuard], loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'transactions',     canActivate: [authGuard], loadComponent: () => import('./components/transactions/transactions.component').then(m => m.TransactionsComponent) },
  { path: 'expenses',         canActivate: [authGuard], loadComponent: () => import('./components/expenses/expenses.component').then(m => m.ExpensesComponent) },
  { path: 'printers',         canActivate: [authGuard], loadComponent: () => import('./components/printers/printers.component').then(m => m.PrintersComponent) },
  { path: 'bank-accounts',    canActivate: [authGuard], loadComponent: () => import('./components/bank-accounts/bank-accounts.component').then(m => m.BankAccountsComponent) },
  { path: 'pan-applications', canActivate: [authGuard], loadComponent: () => import('./components/pan-applications/pan-applications.component').then(m => m.PanApplicationsComponent) },
  { path: 'cash-register',    canActivate: [authGuard], loadComponent: () => import('./components/cash-register/cash-register.component').then(m => m.CashRegisterComponent) },
  { path: 'analytics',        canActivate: [authGuard], loadComponent: () => import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent) },
  { path: 'reports',          canActivate: [authGuard], loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent) },
  { path: 'settings',         canActivate: [authGuard], loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent) },

  { path: '**', redirectTo: 'landing' }
];
