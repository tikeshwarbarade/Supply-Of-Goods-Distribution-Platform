
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-consumer-get-orders',
  templateUrl: './consumer-get-orders.component.html',
  styleUrls: ['./consumer-get-orders.component.scss']
})
export class ConsumerGetOrdersComponent implements OnInit {

  userId: number | null = null;

  orders: any[] = [];

  feedbackOrderId: number | null = null;
  selectedFeedbackOrder: any = null;
  feedbackContent = '';

  message = '';
  messageError = false;

  loading = false;
  submitting = false;

  constructor(
    private auth: AuthService,
    private http: HttpService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.auth.getUserId();
    this.loadOrders();
  }

  loadOrders(): void {
    if (!this.userId) {
      this.setMessage('User session not found.', true);
      return;
    }

    this.loading = true;

    this.http.getOrderConsumer(this.userId).subscribe({
      next: (res: any) => {
        this.orders = Array.isArray(res) ? res : [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load consumer orders', err);
        this.orders = [];
        this.loading = false;
        this.setMessage('Unable to load orders.', true);
      }
    });
  }

  getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '';
  }

  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  return `${window.location.origin}/project/3689/proxy/3000${imageUrl}`;
}

  openFeedback(order: any): void {
    this.selectedFeedbackOrder = order;
    this.feedbackOrderId = order.id;
    this.feedbackContent = '';
    this.message = '';
  }

  cancelFeedback(): void {
    this.selectedFeedbackOrder = null;
    this.feedbackOrderId = null;
    this.feedbackContent = '';
  }

  setFeedbackContent(value: string): void {
    this.feedbackContent = value;
  }

  submitFeedback(): void {
    if (!this.userId) {
      this.setMessage('User session not found.', true);
      return;
    }

    if (!this.selectedFeedbackOrder || !this.selectedFeedbackOrder.id) {
      this.setMessage('Please select an order first.', true);
      return;
    }

    if (this.normalizeStatus(this.selectedFeedbackOrder.status) !== 'DELIVERED') {
      this.setMessage('Feedback can be submitted only for delivered orders.', true);
      return;
    }

    if (!this.feedbackContent.trim()) {
      this.setMessage('Please enter feedback content.', true);
      return;
    }

    const payload = {
      content: this.feedbackContent.trim(),
      timestamp: new Date().toISOString().slice(0, -1)
    };

    this.submitting = true;

    this.http.addConsumerFeedBack(this.selectedFeedbackOrder.id, this.userId, payload).subscribe({
      next: () => {
        this.submitting = false;
        this.setMessage('Feedback submitted successfully.', false);
        this.cancelFeedback();
      },
      error: (err) => {
        console.error('Submit feedback failed', err);
        this.submitting = false;

        const backendMessage =
          err?.error?.message ||
          err?.error?.error ||
          'Failed to submit feedback.';

        this.setMessage(backendMessage, true);
      }
    });
  }

  normalizeStatus(status: string): string {
    return String(status || 'PENDING').toUpperCase();
  }

  getStatusClass(status: string): string {
    const normalized = this.normalizeStatus(status);
    if (normalized === 'SHIPPED') return 'status-shipped';
    if (normalized === 'DELIVERED') return 'status-delivered';
    if (normalized === 'CANCELLED') return 'status-cancelled';
    return 'status-pending';
  }

  getStatusIcon(status: string): string {
    const n = this.normalizeStatus(status);
    return n === 'PENDING' ? 'schedule' : n === 'SHIPPED' ? 'local_shipping' : n === 'DELIVERED' ? 'check_circle' : 'cancel';
  }

  getProductName(product: any): string {
    if (!product) return 'Product not available';
    return product.name || `Product #${product.id || 'N/A'}`;
  }

  getProductPrice(product: any): number {
    return Number(product?.price || 0);
  }

  formatCurrency(value: any): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  setMessage(message: string, isError: boolean): void {
    this.message = message;
    this.messageError = isError;
  }

  goBack(): void {
    this.router.navigate(['/consumer-dashboard']);
  }

  // ═══ STAT GETTERS ═══
  get pendingCount(): number { return this.orders.filter(o => this.normalizeStatus(o.status) === 'PENDING').length; }
  get shippedCount(): number { return this.orders.filter(o => this.normalizeStatus(o.status) === 'SHIPPED').length; }
  get deliveredCount(): number { return this.orders.filter(o => this.normalizeStatus(o.status) === 'DELIVERED').length; }
}