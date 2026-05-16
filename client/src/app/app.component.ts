import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  IsLoggin = false;
  roleName: string | null = null;
  showGlobalNavbar = false;

  private fullScreenRoutes: string[] = [
    '/manufacturer-dashboard',
    '/wholesaler-dashboard',
    '/consumer-dashboard',
    '/consumer-get-orders',
    '/consumer-place-order',
    '/create-product'
  ];

  private publicRoutes: string[] = [
    '/',
    '/login',
    '/registration'
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.loadUserData();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadUserData();
      });
  }

  loadUserData(): void {
    this.IsLoggin = this.authService.getLoginStatus;
    this.roleName = this.authService.getRole;

    const currentUrl = this.router.url.split('?')[0];

    const isPublicRoute = this.publicRoutes.includes(currentUrl);

    const isFullScreenRoute = this.fullScreenRoutes.some(route =>
      currentUrl.startsWith(route)
    );

    if (!this.IsLoggin && !isPublicRoute) {
      this.showGlobalNavbar = false;
      this.router.navigateByUrl('/login');
      return;
    }

    if (this.IsLoggin) {
      this.sessionService.startSessionWatcher();
    }

    this.showGlobalNavbar =
      this.IsLoggin &&
      !isPublicRoute &&
      !isFullScreenRoute;
  }

  logout(): void {
    this.sessionService.logoutManually();
    this.IsLoggin = false;
    this.roleName = null;
    this.showGlobalNavbar = false;
  }
}