import { Component, HostListener } from "@angular/core";
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from "@angular/router";
import { CommonModule, TitleCasePipe } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatMenuModule } from "@angular/material/menu";
import { filter } from "rxjs/operators";
import { AuthService } from "../../../services/auth.service";
import { ThemeService } from "../../../services/theme.service";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    TitleCasePipe,
  ],
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.styles.css"],
})
export class NavbarComponent {
  isCollapsed = false;
  isMobile = false;
  isHomePage = false;

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private router: Router,
  ) {
    this.checkScreen();

    // Track route to know if we're on the home page
    this.isHomePage = this.isHome(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.isHomePage = this.isHome(e.urlAfterRedirects);
        // collapse on mobile after navigating, so the menu doesn't stay open
        if (this.isMobile) this.isCollapsed = true;
      });
  }

  private isHome(url: string): boolean {
    const path = url.split("?")[0].split("#")[0];
    return path === "/" || path === "/home";
  }

  @HostListener("window:resize")
  checkScreen() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) this.isCollapsed = true;
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  get initial() {
    return this.auth.currentUser()?.name?.charAt(0)?.toUpperCase() || "?";
  }

  navItems: NavItem[] = [
    { path: "/home", label: "Home", icon: "home" },
    { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { path: "/transactions", label: "Transactions", icon: "receipt_long" },
    { path: "/expenses", label: "Expenses", icon: "shopping_cart" },
    { path: "/printers", label: "Printers", icon: "print" },
    { path: "/bank-accounts", label: "Bank Accounts", icon: "account_balance" },
    { path: "/cash-register", label: "Cash Register", icon: "point_of_sale" },
    { path: "/pan-applications", label: "PAN Applications", icon: "badge" },
    { path: "/analytics", label: "Analytics", icon: "insights" },
    { path: "/reports", label: "Reports", icon: "bar_chart" },
  ];
}