import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashbaord.component.html',
  styleUrls: ['./dashbaord.component.scss']
})
export class DashbaordComponent implements OnInit {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const role = this.auth.getRole;

    if (role === 'MANUFACTURER') {
      this.router.navigate(['/manufacturer-dashboard']);
      return;
    }

    if (role === 'WHOLESALER') {
      this.router.navigate(['/wholesaler-dashboard']);
      return;
    }

    if (role === 'CONSUMER') {
      this.router.navigate(['/consumer-dashboard']);
      return;
    }

    this.router.navigate(['/login']);
  }
}