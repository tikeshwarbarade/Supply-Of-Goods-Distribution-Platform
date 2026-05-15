import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-manufacturer-dashboard',
  templateUrl: './manufacturer-dashboard.component.html',
  styleUrls: ['./manufacturer-dashboard.component.scss']
})
export class ManufacturerDashboardComponent implements OnInit {

  userId: number | null = null;

  products: any[] = [];
  filteredProducts: any[] = [];

  receivedOrders: any[] = [];

  productSearch = '';

  loadingProducts = false;
  loadingOrders = false;

  toastMessage = '';
  toastVisible = false;
  toastError = false;

  readonly statuses: string[] = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  constructor(
    private auth: AuthService,
    private http: HttpService,
    private router: Router,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.userId = this.auth.getUserId();
    this.refresh();
  }

  // =========================
  // LOAD DASHBOARD DATA
  // =========================

  refresh(): void {
    this.loadProducts();
    this.loadReceivedOrders();
  }

  loadProducts(): void {
    if (!this.userId) {
      this.showToast('User session not found. Please login again.', true);
      return;
    }

    this.loadingProducts = true;

    this.http.getProductsByManufacturer(this.userId).subscribe({
      next: (res: any) => {
        this.products = Array.isArray(res) ? res : [];
        this.filteredProducts = [...this.products];
        this.loadingProducts = false;
      },
      error: (err) => {
        console.error('Failed to load manufacturer products', err);
        this.products = [];
        this.filteredProducts = [];
        this.loadingProducts = false;
        this.showToast('Unable to load products from backend.', true);
      }
    });
  }

  loadReceivedOrders(): void {
    if (!this.userId) {
      return;
    }

    this.loadingOrders = true;

    this.http.getOrdersByManufacturer(this.userId).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : [];

        this.receivedOrders = data.map(order => ({
          ...order,
          selectedStatus: this.normalizeStatus(order.status)
        }));

        this.loadingOrders = false;
      },
      error: (err) => {
        console.error('Failed to load manufacturer received orders', err);
        this.receivedOrders = [];
        this.loadingOrders = false;
        this.showToast('Unable to load received orders from backend.', true);
      }
    });
  }

  // =========================
  // DASHBOARD STATS
  // =========================

  get productCount(): number {
    return this.products.length;
  }

  get totalStock(): number {
    return this.products.reduce((sum, product) => {
      return sum + Number(product.stockQuantity || 0);
    }, 0);
  }

  get inventoryValue(): number {
    return this.products.reduce((sum, product) => {
      return sum + Number(product.price || 0) * Number(product.stockQuantity || 0);
    }, 0);
  }

  get lowStockCount(): number {
    return this.products.filter(product => Number(product.stockQuantity || 0) < 10).length;
  }

  get receivedOrderCount(): number {
    return this.receivedOrders.length;
  }

  get deliveredOrderCount(): number {
    return this.receivedOrders.filter(order => {
      return this.normalizeStatus(order.status) === 'DELIVERED';
    }).length;
  }

  // =========================
  // SEARCH
  // =========================

  onProductSearch(value: string): void {
    this.productSearch = value;
    this.applyProductSearch();
  }

  clearSearch(): void {
    this.productSearch = '';
    this.applyProductSearch();
  }

  applyProductSearch(): void {
    const query = this.productSearch.trim().toLowerCase();

    if (!query) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products.filter(product => {
      return [
        product.id,
        product.name,
        product.description,
        product.price,
        product.stockQuantity
      ]
        .map(value => String(value ?? '').toLowerCase())
        .join(' ')
        .includes(query);
    });
  }

  // =========================
  // ORDER STATUS UPDATE
  // =========================

  updateReceivedOrderStatus(order: any): void {
    const status = order.selectedStatus || 'PENDING';

    this.http.updateManufacturerOrderStatus(order.id, status).subscribe({
      next: () => {
        this.showToast('Order status updated successfully.');

        if (status === 'DELIVERED') {
          this.showToast('Order delivered. Wholesaler inventory will be updated.');
        }

        this.loadReceivedOrders();
        this.loadProducts();
      },
      error: (err) => {
        console.error('Failed to update manufacturer order status', err);

        const backendMessage =
          err?.error?.message ||
          err?.error?.error ||
          'Failed to update order status.';

        this.showToast(backendMessage, true);
      }
    });
  }

  // =========================
  // NAVIGATION
  // =========================

  goToCreateProduct(): void {
    this.router.navigate(['/create-product']);
  }

  editProduct(product: any): void {
    this.router.navigate(['/create-product'], {
      queryParams: {
        editProductId: product.id
      }
    });
  }

  logout(): void {
    this.sessionService.logoutManually();
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  // =========================
  // HELPERS
  // =========================

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

  getWholesalerName(user: any): string {
    if (!user) {
      return 'Wholesaler';
    }

    return user.username || user.email || `User #${user.id || 'N/A'}`;
  }

  formatCurrency(value: any): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  showToast(message: string, isError: boolean = false): void {
    this.toastMessage = message;
    this.toastError = isError;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 2600);
  }
}