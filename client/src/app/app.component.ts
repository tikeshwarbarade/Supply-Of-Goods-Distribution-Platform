import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  IsLoggin: boolean = false;
  roleName: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();

    // ✅ Re-check login/role after every navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadUserData();
      });
  }

  loadUserData() {
    this.IsLoggin = this.authService.getLoginStatus;
    this.roleName = this.authService.getRole;

    const currentUrl = this.router.url;
    const publicRoutes = ['/login', '/registration'];

    if (!this.IsLoggin && !publicRoutes.includes(currentUrl)) {
      this.router.navigateByUrl('/login');
    }
  }

  logout() {
    this.authService.logout();
    this.IsLoggin = false;
    this.roleName = null;
    this.router.navigateByUrl('/login');
  }
}