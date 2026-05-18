
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';
import { SessionService } from '../../services/session.service';

type DashboardSection =
  | 'overview'
  | 'products'
  | 'purchaseOrders'
  | 'inventory'
  | 'customerOrders'
  | 'feedbacks';

@Component({
  selector: 'app-wholesaler-dashboard',
  templateUrl: './wholesaler-dashboard.component.html',
  styleUrls: ['./wholesaler-dashboard.component.scss']
})
export class WholesalerDashboardComponent implements OnInit {

  userId: number | null = null;

  activeSection: DashboardSection = 'overview';

  products: any[] = [];
  filteredProducts: any[] = [];

  purchaseOrders: any[] = [];
  customerOrders: any[] = [];
  inventories: any[] = [];
  feedbacks: any[] = [];

  productSearch = '';

  selectedProduct: any = null;
  orderDrawerOpen = false;
  orderQuantity: number | null = null;

  inventoryProductId: number | null = null;
  inventoryStock: number | null = null;
  editingInventoryId: number | null = null;

  toastMessage = '';
  toastVisible = false;
  toastError = false;

  loading = false;

  readonly statuses: string[] = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  constructor(
    private auth: AuthService,
    private http: HttpService,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.userId = this.auth.getUserId();
    this.refreshDashboard();
  }

  // =========================
  // COMMON
  // =========================

  showSection(section: DashboardSection): void {
    this.activeSection = section;
  }

  showToast(message: string, isError: boolean = false): void {
    this.toastMessage = message;
    this.toastError = isError;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 2600);
  }

  logout(): void {
    this.sessionService.logoutManually();
  }

  refreshDashboard(): void {
    this.loading = true;

    this.loadProducts();
    this.loadPurchaseOrders();
    this.loadInventories();
    this.loadCustomerOrders();
    this.loadFeedbacks();

    setTimeout(() => {
      this.loading = false;
    }, 600);
  }

  // =========================
  // LOAD DATA
  // =========================

  loadProducts(): void {
    this.http.getProductsByWholesaler().subscribe({
      next: (res: any) => {
        this.products = Array.isArray(res) ? res : [];
        this.filteredProducts = [...this.products];
        this.applyProductSearch();
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.products = [];
        this.filteredProducts = [];
        this.showToast('Unable to load products.', true);
      }
    });
  }

  loadPurchaseOrders(): void {
    if (!this.userId) return;

    this.http.getOrderByWholesalers(this.userId).subscribe({
      next: (res: any) => {
        this.purchaseOrders = Array.isArray(res) ? res : [];
      },
      error: (err) => {
        console.error('Failed to load purchase orders', err);
        this.purchaseOrders = [];
        this.showToast('Unable to load purchase orders.', true);
      }
    });
  }

  loadInventories(): void {
    if (!this.userId) return;

    this.http.getInventoryByWholesalers(this.userId).subscribe({
      next: (res: any) => {
        this.inventories = Array.isArray(res) ? res : [];
      },
      error: (err) => {
        console.error('Failed to load inventories', err);
        this.inventories = [];
        this.showToast('Unable to load inventory.', true);
      }
    });
  }

  loadCustomerOrders(): void {
    if (!this.userId) return;

    this.http.getCustomerOrdersByWholesaler(this.userId).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : [];

        this.customerOrders = data.map(order => ({
          ...order,
          selectedStatus: this.normalizeStatus(order.status)
        }));
      },
      error: (err) => {
        console.error('Failed to load customer orders', err);
        this.customerOrders = [];
        this.showToast('Unable to load customer orders.', true);
      }
    });
  }

  loadFeedbacks(): void {
    if (!this.userId) return;

    this.http.getWholesalerFeedbacks(this.userId).subscribe({
      next: (res: any) => {
        this.feedbacks = Array.isArray(res) ? res : [];
      },
      error: (err) => {
        console.error('Failed to load feedbacks', err);
        this.feedbacks = [];
      }
    });
  }

  // =========================
  // STATS
  // =========================

  // =========================
// IMAGE / PRODUCT CARD HELPERS
// =========================

getBackendBaseUrl(): string {
  const origin = window.location.origin;
  const pathname = window.location.pathname;

  const match = pathname.match(/(\/project\/\d+)\/proxy\/\d+/);

  if (match && match[1]) {
    return `${origin}${match[1]}/proxy/3000`;
  }

  return `${origin}/project/1910/proxy/3000`;
}

getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '';
  }

  if (
    imageUrl.startsWith('http') ||
    imageUrl.startsWith('data:') ||
    imageUrl.startsWith('blob:')
  ) {
    return imageUrl;
  }

  if (imageUrl.startsWith('/project/')) {
    return `${window.location.origin}${imageUrl}`;
  }

  const baseUrl = this.getBackendBaseUrl();
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  return `${baseUrl}${cleanPath}`;
}

onProductImageError(product: any): void {
  product.imageUrl = null;
}

getProductStockLabel(stock: number): string {
  if (!stock || stock === 0) {
    return 'Out of Stock';
  }

  if (stock < 10) {
    return 'Low Stock';
  }

  return 'Best Seller';
}

  get purchaseDeliveredCount(): number {
    return this.purchaseOrders.filter(order => this.normalizeStatus(order.status) === 'DELIVERED').length;
  }

  get customerDeliveredCount(): number {
    return this.customerOrders.filter(order => this.normalizeStatus(order.status) === 'DELIVERED').length;
  }

  get totalInventoryStock(): number {
    return this.inventories.reduce((sum, item) => {
      return sum + Number(item.stockQuantity || 0);
    }, 0);
  }

  // =========================
  // PRODUCT SEARCH
  // =========================

  onProductSearch(value: string): void {
    this.productSearch = value;
    this.applyProductSearch();
  }

  clearProductSearch(): void {
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
        product.stockQuantity,
        product.manufacturerId
      ]
        .map(value => String(value ?? '').toLowerCase())
        .join(' ')
        .includes(query);
    });
  }

  // =========================
  // PLACE ORDER TO MANUFACTURER
  // =========================

  openOrderDrawer(product: any): void {
    this.selectedProduct = product;
    this.orderQuantity = null;
    this.orderDrawerOpen = true;
  }

  closeOrderDrawer(): void {
    this.orderDrawerOpen = false;
    this.selectedProduct = null;
    this.orderQuantity = null;
  }

  setOrderQuantity(value: string): void {
    this.orderQuantity = value ? Number(value) : null;
  }

  placeWholesalerOrder(): void {
    if (!this.selectedProduct?.id) {
      this.showToast('Please select a product first.', true);
      return;
    }

    if (!this.userId) {
      this.showToast('User session not found.', true);
      return;
    }

    if (!this.orderQuantity || this.orderQuantity <= 0) {
      this.showToast('Please enter valid quantity.', true);
      return;
    }

    const payload = {
      quantity: this.orderQuantity,
      status: 'PENDING'
    };

    this.http.placeOrder(payload, this.selectedProduct.id, this.userId).subscribe({
      next: () => {
        this.showToast('Purchase order placed. Waiting for manufacturer update.');
        this.closeOrderDrawer();
        this.loadPurchaseOrders();
        this.showSection('purchaseOrders');
      },
      error: (err) => {
        console.error('Place purchase order failed', err);
        this.showToast('Failed to place purchase order.', true);
      }
    });
  }

  // =========================
  // CUSTOMER ORDER STATUS
  // =========================

  updateCustomerOrderStatus(order: any): void {
    const status = order.selectedStatus || 'PENDING';

    this.http.updateCustomerOrderStatus(order.id, status).subscribe({
      next: () => {
        this.showToast('Customer order status updated.');
        this.loadCustomerOrders();
        this.loadInventories();
      },
      error: (err) => {
        console.error('Customer order status update failed', err);

        const message =
          err?.error?.message ||
          err?.error?.error ||
          'Failed to update customer order status.';

        this.showToast(message, true);
      }
    });
  }

  // =========================
  // INVENTORY
  // =========================

  selectProductForInventory(product: any): void {
    this.activeSection = 'inventory';
    this.inventoryProductId = product.id;
    this.inventoryStock = null;
    this.editingInventoryId = null;
    this.showToast(`${product.name} selected for inventory.`);
  }
submitInventory(): void {
  if (!this.editingInventoryId) {
    this.showToast(
      'Direct inventory add is disabled. Inventory is added automatically after manufacturer delivers a purchase order.',
      true
    );
    return;
  }

  if (!this.inventoryStock || this.inventoryStock <= 0) {
    this.showToast('Please enter valid stock quantity.', true);
    return;
  }

  this.updateInventory();
}

addInventory(): void {
  this.showToast(
    'Direct inventory add is disabled. Inventory is created automatically when manufacturer delivers a purchase order.',
    true
  );
}
  updateInventory(): void {
    if (!this.editingInventoryId || !this.inventoryStock) return;

    this.http.updateInventory(this.inventoryStock, this.editingInventoryId).subscribe({
      next: () => {
        this.showToast('Inventory updated successfully.');
        this.resetInventoryForm();
        this.loadInventories();
      },
      error: (err) => {
        console.error('Update inventory failed', err);
        this.showToast('Failed to update inventory.', true);
      }
    });
  }

  editInventory(inventory: any): void {
    this.editingInventoryId = inventory.id;
    this.inventoryProductId = inventory.product?.id || null;
    this.inventoryStock = inventory.stockQuantity || null;
    this.activeSection = 'inventory';
  }

  resetInventoryForm(): void {
    this.editingInventoryId = null;
    this.inventoryProductId = null;
    this.inventoryStock = null;
  }

  setInventoryProductId(value: string): void {
    this.inventoryProductId = value ? Number(value) : null;
  }

  setInventoryStock(value: string): void {
    this.inventoryStock = value ? Number(value) : null;
  }

  // =========================
  // HELPERS
  // =========================

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

  getProductName(product: any): string {
    if (!product) return 'Product not available';
    return product.name || `Product #${product.id || 'N/A'}`;
  }

  getUserName(user: any): string {
    if (!user) return 'User';
    return user.username || user.email || `User #${user.id || 'N/A'}`;
  }

  formatCurrency(value: any): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }
}
