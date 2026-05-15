import { Component, OnInit } from '@angular/core';
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
    private http: HttpService
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

    if (normalized === 'SHIPPED') {
      return 'status-shipped';
    }

    if (normalized === 'DELIVERED') {
      return 'status-delivered';
    }

    if (normalized === 'CANCELLED') {
      return 'status-cancelled';
    }

    return 'status-pending';
  }

  getProductName(product: any): string {
    if (!product) {
      return 'Product not available';
    }

    return product.name || `Product #${product.id || 'N/A'}`;
  }

  setMessage(message: string, isError: boolean): void {
    this.message = message;
    this.messageError = isError;
  }
}