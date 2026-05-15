import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-consumer-dashboard',
  templateUrl: './consumer-dashboard.component.html',
  styleUrls: ['./consumer-dashboard.component.scss']
})
export class ConsumerDashboardComponent {

  constructor(
    private router: Router,
    private sessionService: SessionService
  ) {}

  goToPlaceOrder(): void {
    this.router.navigate(['/consumer-place-order']);
  }

  goToOrders(): void {
    this.router.navigate(['/consumer-get-orders']);
  }

  logout(): void {
    this.sessionService.logoutManually();
  }
}