import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';
import { SessionService } from '../../services/session.service';

type DashboardSection = 'overview' | 'products' | 'orders' | 'inventory';

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
  orders: any[] = [];
  inventories: any[] = [];

  productSearch: string = '';

  selectedProduct: any = null;
  orderDrawerOpen: boolean = false;
  orderQuantity: number | null = null;
  orderStatus: string = 'PENDING';

  inventoryProductId: number | null = null;
  inventoryStock: number | null = null;
  editingInventoryId: number | null = null;

  toastMessage: string = '';
  toastVisible: boolean = false;

  loading: boolean = false;

  readonly statuses: string[] = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  constructor(
    private auth: AuthService,
    private http: HttpService,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.userId = this.auth.getUserId();
    this.loadWholesalerDashboard();
  }

  // =========================
  // COMMON
  // =========================

  showSection(section: DashboardSection): void {
    this.activeSection = section;
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 2600);
  }

  logout(): void {
    this.sessionService.logoutManually();
  }

  refreshDashboard(): void {
    this.loadWholesalerDashboard();
  }

  // =========================
  // LOAD DASHBOARD DATA
  // =========================

  loadWholesalerDashboard(): void {
    this.loading = true;
    this.showToast('Loading wholesaler dashboard data...');

    this.loadProducts();
    this.loadOrders();
    this.loadInventories();

    setTimeout(() => {
      this.loading = false;
    }, 600);
  }

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
        this.showToast('Unable to load products from backend.');
      }
    });
  }

  loadOrders(): void {
    if (!this.userId) {
      return;
    }

    this.http.getOrderByWholesalers(this.userId).subscribe({
      next: (res: any) => {
        this.orders = Array.isArray(res) ? res : [];

        this.orders = this.orders.map(order => ({
          ...order,
          selectedStatus: this.normalizeStatus(order.status)
        }));
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.orders = [];
        this.showToast('Unable to load orders from backend.');
      }
    });
  }

  loadInventories(): void {
    if (!this.userId) {
      return;
    }

    this.http.getInventoryByWholesalers(this.userId).subscribe({
      next: (res: any) => {
        this.inventories = Array.isArray(res) ? res : [];
      },
      error: (err) => {
        console.error('Failed to load inventories', err);
        this.inventories = [];
        this.showToast('Unable to load inventories from backend.');
      }
    });
  }

  // =========================
  // STATS
  // =========================

  get deliveredOrderCount(): number {
    return this.orders.filter(order =>
      this.normalizeStatus(order.status) === 'DELIVERED'
    ).length;
  }

  // =========================
  // PRODUCTS
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
      const searchableText = [
        product.id,
        product.name,
        product.description,
        product.price,
        product.stockQuantity,
        product.manufacturerId
      ]
        .map(value => String(value ?? '').toLowerCase())
        .join(' ');

      return searchableText.includes(query);
    });
  }

  openOrderDrawer(product: any): void {
    this.selectedProduct = product;
    this.orderQuantity = null;
    this.orderStatus = 'PENDING';
    this.orderDrawerOpen = true;
  }

  closeOrderDrawer(): void {
    this.orderDrawerOpen = false;
    this.selectedProduct = null;
    this.orderQuantity = null;
    this.orderStatus = 'PENDING';
  }

  selectProductForInventory(product: any): void {
    this.activeSection = 'inventory';
    this.inventoryProductId = product.id;
    this.inventoryStock = null;
    this.editingInventoryId = null;
    this.showToast(`${product.name} selected for inventory.`);
  }

  // =========================
  // PLACE ORDER
  // =========================

  placeWholesalerOrder(): void {
    if (!this.selectedProduct || !this.selectedProduct.id) {
      this.showToast('Please select a product first.');
      return;
    }

    if (!this.userId) {
      this.showToast('User session not found. Please login again.');
      return;
    }

    if (!this.orderQuantity || this.orderQuantity <= 0) {
      this.showToast('Please enter a valid order quantity.');
      return;
    }

    const payload = {
      quantity: this.orderQuantity,
      status: this.orderStatus
    };

    this.http.placeOrder(payload, this.selectedProduct.id, this.userId).subscribe({
      next: () => {
        this.showToast('Order placed successfully.');
        this.closeOrderDrawer();
        this.loadOrders();
        this.activeSection = 'orders';
      },
      error: (err) => {
        console.error('Place order failed', err);
        this.showToast('Failed to place order.');
      }
    });
  }

  // =========================
  // ORDER STATUS
  // =========================

  updateOrderStatus(order: any): void {
    const status = order.selectedStatus || 'PENDING';

    this.http.updateOrderStatus(order.id, status).subscribe({
      next: () => {
        this.showToast('Order status updated successfully.');
        order.status = status;
        this.loadOrders();
      },
      error: (err) => {
        console.error('Order status update failed', err);
        this.showToast('Failed to update order status.');
      }
    });
  }

  // =========================
  // INVENTORY
  // =========================

  submitInventory(): void {
    if (!this.inventoryProductId) {
      this.showToast('Please select a product.');
      return;
    }

    if (!this.inventoryStock || this.inventoryStock <= 0) {
      this.showToast('Please enter a valid stock quantity.');
      return;
    }

    if (this.editingInventoryId) {
      this.updateInventory();
    } else {
      this.addInventory();
    }
  }

  addInventory(): void {
    if (!this.userId || !this.inventoryProductId || !this.inventoryStock) {
      return;
    }

    const payload = {
      wholesalerId: this.userId,
      stockQuantity: this.inventoryStock
    };

    this.http.addInventory(payload, this.inventoryProductId).subscribe({
      next: () => {
        this.showToast('Inventory added successfully.');
        this.resetInventoryForm();
        this.loadInventories();
      },
      error: (err) => {
        console.error('Add inventory failed', err);
        this.showToast('Failed to add inventory.');
      }
    });
  }

  updateInventory(): void {
    if (!this.editingInventoryId || !this.inventoryStock) {
      return;
    }

    this.http.updateInventory(this.inventoryStock, this.editingInventoryId).subscribe({
      next: () => {
        this.showToast('Inventory updated successfully.');
        this.resetInventoryForm();
        this.loadInventories();
      },
      error: (err) => {
        console.error('Update inventory failed', err);
        this.showToast('Failed to update inventory.');
      }
    });
  }

  editInventory(inventory: any): void {
    this.editingInventoryId = inventory.id;
    this.inventoryProductId = inventory.product?.id || null;
    this.inventoryStock = inventory.stockQuantity || null;
    this.activeSection = 'inventory';
    this.showToast('Inventory loaded for editing.');
  }

  resetInventoryForm(): void {
    this.editingInventoryId = null;
    this.inventoryProductId = null;
    this.inventoryStock = null;
  }

  // =========================
  // TEMPLATE VALUE SETTERS
  // =========================

  setInventoryProductId(value: string): void {
    this.inventoryProductId = value ? Number(value) : null;
  }

  setInventoryStock(value: string): void {
    this.inventoryStock = value ? Number(value) : null;
  }

  setOrderQuantity(value: string): void {
    this.orderQuantity = value ? Number(value) : null;
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

  formatCurrency(value: any): string {
    const amount = Number(value || 0);

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  }
}