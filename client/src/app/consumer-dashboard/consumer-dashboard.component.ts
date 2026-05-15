import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-consumer-dashboard',
  templateUrl: './consumer-dashboard.component.html',
  styleUrls: ['./consumer-dashboard.component.scss']
})
export class ConsumerDashboardComponent implements OnInit {

  userId: number | null = null;

  inventories: any[] = [];
  orders: any[] = [];

  constructor(
    private auth: AuthService,
    private http: HttpService,
    private router: Router,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.userId = this.auth.getUserId();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loadInventories();
    this.loadOrders();
  }

  loadInventories(): void {
    this.http.getInventoriesForConsumers().subscribe({
      next: (res: any) => {
        this.inventories = Array.isArray(res) ? res : [];
      },
      error: (err) => {
        console.error('Failed to load consumer inventories', err);
        this.inventories = [];
      }
    });
  }

  loadOrders(): void {
    if (!this.userId) return;

    this.http.getOrderConsumer(this.userId).subscribe({
      next: (res: any) => {
        this.orders = Array.isArray(res) ? res : [];
      },
      error: (err) => {
        console.error('Failed to load consumer orders', err);
        this.orders = [];
      }
    });
  }

  get deliveredOrders(): number {
    return this.orders.filter(order => String(order.status || '').toUpperCase() === 'DELIVERED').length;
  }

  get pendingOrders(): number {
    return this.orders.filter(order => String(order.status || '').toUpperCase() === 'PENDING').length;
  }

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