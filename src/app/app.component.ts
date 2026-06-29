import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  template: `
    <!-- Public routes (landing, login) render full-page, no sidebar -->
    <router-outlet *ngIf="!showShell"></router-outlet>

    <!-- App shell with sidebar for everything else -->
    <div class="page-container" *ngIf="showShell">
      <app-navbar></app-navbar>
      <div class="main-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class AppComponent {
  showShell = true;
  private noShellRoutes = ['/landing', '/login'];

  constructor(private router: Router) {
    this.updateShell(this.router.url);
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => this.updateShell(e.urlAfterRedirects));
  }

  private updateShell(url: string) {
    this.showShell = !this.noShellRoutes.some(r => url.startsWith(r));
  }
}
