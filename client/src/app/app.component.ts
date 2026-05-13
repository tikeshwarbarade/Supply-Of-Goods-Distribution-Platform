import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  IsLoggin: boolean = false;
  roleName: string | null = null;

  constructor(private authService: AuthService,
              private router: Router) {}

  // ✅ USE ngOnInit (IMPORTANT)
  ngOnInit() {
    this.loadUserData();
  }

  // ✅ reusable function
  loadUserData() {
    this.IsLoggin = this.authService.getLoginStatus;
    this.roleName = this.authService.getRole;

    if (!this.IsLoggin) {
      this.router.navigateByUrl('/login');
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
