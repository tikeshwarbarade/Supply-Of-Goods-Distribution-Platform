import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SessionService } from '../services/session.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  IsLoggin: boolean = false;
  roleName: string | null = null;
  showGlobalNavbar: boolean = false;

  private fullScreenDashboardRoutes: string[] = [
    '/manufacturer-dashboard',
    '/wholesaler-dashboard',
    '/consumer-dashboard'
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    this.loadUserData();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadUserData();
      });
  }

  loadUserData() {
    this.IsLoggin = this.authService.getLoginStatus;
    this.roleName = this.authService.getRole;

    const currentUrl = this.router.url.split('?')[0];

    const publicRoutes = ['/login', '/registration'];

    if (!this.IsLoggin && !publicRoutes.includes(currentUrl)) {
      this.showGlobalNavbar = false;
      this.router.navigateByUrl('/login');
      return;
    }

    if (this.IsLoggin) {
      this.sessionService.startSessionWatcher();
    }

    // ✅ Hide global navbar on full-screen dashboards
    this.showGlobalNavbar =
      this.IsLoggin &&
      !publicRoutes.includes(currentUrl) &&
      !this.fullScreenDashboardRoutes.includes(currentUrl);
  }

  logout() {
    this.sessionService.logoutManually();
    this.IsLoggin = false;
    this.roleName = null;
    this.showGlobalNavbar = false;
  }
}