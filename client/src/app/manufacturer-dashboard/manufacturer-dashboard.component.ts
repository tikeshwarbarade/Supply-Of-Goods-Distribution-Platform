import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';
import { SessionService } from '../../services/session.service';

type ManufacturerSection =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'warehouses'
  | 'analytics'
  | 'finance'
  | 'customers'
  | 'suppliers'
  | 'settings';

type ModalType =
  | ''
  | 'product'
  | 'order'
  | 'warehouse'
  | 'customer'
  | 'supplier'
  | 'status'
  | 'import';

@Component({
  selector: 'app-manufacturer-dashboard',
  templateUrl: './manufacturer-dashboard.component.html',
  styleUrls: ['./manufacturer-dashboard.component.scss']
})
export class ManufacturerDashboardComponent implements OnInit {

  userId: number | null = null;

  activeSection: ManufacturerSection = 'dashboard';
  sectionTitle = 'Manufacturing Intelligence Hub';

  globalSearch = '';
  productSearch = '';

  products: any[] = [];
  filteredProducts: any[] = [];

  orders: any[] = [];
  filteredOrders: any[] = [];

  warehouses: any[] = [];

  customers: any[] = [];
  filteredCustomers: any[] = [];

  suppliers: any[] = [];
  filteredSuppliers: any[] = [];

  modal: ModalType = '';

  editingProductId: number | null = null;
  editingOrderId: number | null = null;

  stockThreshold = 25;
  darkMode = false;

  notificationMessage = '';
  notificationVisible = false;
  notificationError = false;
  notificationTimer: any;

  productForm = {
    name: '',
    description: '',
    price: null as number | null,
    stock: null as number | null
  };

  orderForm = {
    productId: null as number | null,
    customerId: null as number | null,
    quantity: null as number | null
  };

  warehouseForm = {
    name: '',
    location: '',
    capacity: null as number | null
  };

  customerForm = {
    name: '',
    email: '',
    phone: '',
    company: ''
  };

  supplierForm = {
    name: '',
    material: '',
    contact: ''
  };

  statusForm = {
    status: 'Pending'
  };

  readonly statusOptions = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

  constructor(
    private auth: AuthService,
    private http: HttpService,
    private router: Router,
    private sessionService: SessionService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.userId = this.auth.getUserId();

    this.loadLocalMockData();
    this.loadManufacturerProductsFromBackend();
    this.refreshComputedData();

    const savedDarkMode = localStorage.getItem('nexus_dark_mode') === 'true';
    this.toggleDarkMode(savedDarkMode);
  }

  // =========================
  // DATA LOAD
  // =========================

  loadLocalMockData(): void {
    this.products = this.getLocalData('nexus_products', [
      {
        id: 1,
        name: 'Industrial Valve',
        description: 'Heavy duty industrial valve, PN16',
        price: 4200,
        stock: 80,
        stockQuantity: 80,
        icon: 'fas fa-microchip'
      },
      {
        id: 2,
        name: 'Hydraulic Pump',
        description: 'Advanced hydraulic system, 2500 PSI',
        price: 12800,
        stock: 22,
        stockQuantity: 22,
        icon: 'fas fa-oil-can'
      },
      {
        id: 3,
        name: 'Servo Motor',
        description: 'Precision motion control, 400W',
        price: 8900,
        stock: 15,
        stockQuantity: 15,
        icon: 'fas fa-cogs'
      },
      {
        id: 4,
        name: 'Conveyor Belt',
        description: 'Modular belt system 10m',
        price: 24500,
        stock: 8,
        stockQuantity: 8,
        icon: 'fas fa-industry'
      }
    ]);

    this.orders = this.getLocalData('nexus_orders', [
      {
        id: 101,
        customerId: 1,
        customerName: 'Tata Industries',
        productId: 1,
        productName: 'Industrial Valve',
        quantity: 4,
        total: 16800,
        status: 'Delivered',
        date: '2025-02-10'
      },
      {
        id: 102,
        customerId: 2,
        customerName: 'Reliance Auto',
        productId: 2,
        productName: 'Hydraulic Pump',
        quantity: 2,
        total: 25600,
        status: 'Pending',
        date: '2025-02-18'
      },
      {
        id: 103,
        customerId: 1,
        customerName: 'Tata Industries',
        productId: 3,
        productName: 'Servo Motor',
        quantity: 3,
        total: 26700,
        status: 'Shipped',
        date: '2025-02-20'
      }
    ]);

    this.warehouses = this.getLocalData('nexus_warehouses', [
      {
        id: 1,
        name: 'Mumbai Mega Hub',
        location: 'Maharashtra',
        capacity: 5000,
        used: 2100
      },
      {
        id: 2,
        name: 'Chennai Logistics',
        location: 'Tamil Nadu',
        capacity: 3200,
        used: 1850
      },
      {
        id: 3,
        name: 'Delhi NCR Depot',
        location: 'Delhi',
        capacity: 4800,
        used: 3050
      },
      {
        id: 4,
        name: 'Bengaluru Tech Hub',
        location: 'Karnataka',
        capacity: 6200,
        used: 4100
      }
    ]);

    this.customers = this.getLocalData('nexus_customers', [
      {
        id: 1,
        name: 'Tata Industries',
        email: 'contact@tata.com',
        phone: '+91-22-1234567',
        company: 'Tata Group'
      },
      {
        id: 2,
        name: 'Reliance Auto',
        email: 'procure@relianceauto.in',
        phone: '+91-22-7654321',
        company: 'Reliance'
      },
      {
        id: 3,
        name: 'Mahindra Precision',
        email: 'machining@mahindra.com',
        phone: '+91-20-998877',
        company: 'Mahindra'
      }
    ]);

    this.suppliers = this.getLocalData('nexus_suppliers', [
      {
        id: 1,
        name: 'SteelMint India',
        material: 'Raw Steel',
        contact: 'sales@steelmint.com'
      },
      {
        id: 2,
        name: 'ElectroComponents Ltd',
        material: 'Electronic Parts',
        contact: 'orders@electrocomp.com'
      }
    ]);

    this.stockThreshold = Number(localStorage.getItem('stockThreshold') || 25);
  }

  loadManufacturerProductsFromBackend(): void {
    if (!this.userId) {
      return;
    }

    this.http.getProductsByManufacturer(this.userId).subscribe({
      next: (res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          this.products = res.map(product => ({
            ...product,
            stock: product.stockQuantity ?? product.stock ?? 0,
            stockQuantity: product.stockQuantity ?? product.stock ?? 0,
            icon: product.icon || 'fas fa-box'
          }));

          this.persistAll();
          this.refreshComputedData();
        }
      },
      error: (err) => {
        console.warn('Manufacturer products backend not available, using mock/local data.', err);
      }
    });
  }

  getLocalData(key: string, fallback: any[]): any[] {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  persistAll(): void {
    localStorage.setItem('nexus_products', JSON.stringify(this.products));
    localStorage.setItem('nexus_orders', JSON.stringify(this.orders));
    localStorage.setItem('nexus_warehouses', JSON.stringify(this.warehouses));
    localStorage.setItem('nexus_customers', JSON.stringify(this.customers));
    localStorage.setItem('nexus_suppliers', JSON.stringify(this.suppliers));
  }

  refreshComputedData(): void {
    this.applyProductSearch();
    this.applyOrderSearch();
    this.applyCustomerSearch();
    this.applySupplierSearch();
  }

  // =========================
  // NAVIGATION
  // =========================

  switchSection(section: ManufacturerSection): void {
    this.activeSection = section;

    const labels: Record<ManufacturerSection, string> = {
      dashboard: 'Dashboard',
      products: 'Products',
      orders: 'Orders',
      warehouses: 'Warehouses',
      analytics: 'Analytics',
      finance: 'Finance',
      customers: 'Customers',
      suppliers: 'Suppliers',
      settings: 'Settings'
    };

    this.sectionTitle = section === 'dashboard'
      ? 'Manufacturing Intelligence Hub'
      : labels[section];

    this.applyGlobalSearch();
  }

  quickCreate(): void {
    if (this.activeSection === 'products') {
      this.openProductModal();
      return;
    }

    if (this.activeSection === 'orders') {
      this.openOrderModal();
      return;
    }

    if (this.activeSection === 'warehouses') {
      this.openWarehouseModal();
      return;
    }

    if (this.activeSection === 'customers') {
      this.openCustomerModal();
      return;
    }

    if (this.activeSection === 'suppliers') {
      this.openSupplierModal();
      return;
    }

    this.showToast('Go to Products, Orders, Warehouses, Customers or Suppliers to quick create.');
  }

  logout(): void {
    this.sessionService.logoutManually();
  }

  // =========================
  // STATS
  // =========================

  get totalRevenue(): number {
    return this.orders
      .filter(order => order.status === 'Delivered')
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
  }

  get grossRevenue(): number {
    return this.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  }

  get netProfit(): number {
    return Math.round(this.grossRevenue * 0.28);
  }

  get inventoryValue(): number {
    return this.products.reduce((sum, product) => {
      return sum + this.productInventoryValue(product);
    }, 0);
  }

  get outstandingValue(): number {
    return this.orders
      .filter(order => order.status !== 'Delivered' && order.status !== 'Cancelled')
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
  }

  get lowStockProducts(): any[] {
    return this.products.filter(product => {
      return this.getStock(product) < this.stockThreshold;
    });
  }

  get recentOrders(): any[] {
    return [...this.orders].slice(-5).reverse();
  }

  get topProductsByValue(): any[] {
    return [...this.products]
      .sort((a, b) => this.productInventoryValue(b) - this.productInventoryValue(a))
      .slice(0, 5);
  }

  get orderStatusDistribution(): any[] {
    return this.statusOptions.map(status => ({
      status,
      count: this.orders.filter(order => order.status === status).length
    }));
  }

  // =========================
  // SEARCH
  // =========================

  setGlobalSearch(value: string): void {
    this.globalSearch = value;
    this.applyGlobalSearch();
  }

  applyGlobalSearch(): void {
    if (this.activeSection === 'products') {
      this.productSearch = this.globalSearch;
      this.applyProductSearch();
      return;
    }

    if (this.activeSection === 'orders') {
      this.applyOrderSearch();
      return;
    }

    if (this.activeSection === 'customers') {
      this.applyCustomerSearch();
      return;
    }

    if (this.activeSection === 'suppliers') {
      this.applySupplierSearch();
      return;
    }

    this.refreshComputedData();
  }

  setProductSearch(value: string): void {
    this.productSearch = value;
    this.applyProductSearch();
  }

  applyProductSearch(): void {
    const term = this.productSearch.trim().toLowerCase();

    if (!term) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products.filter(product => {
      return [
        product.name,
        product.description,
        product.price,
        product.stock,
        product.stockQuantity
      ].join(' ').toLowerCase().includes(term);
    });
  }

  applyOrderSearch(): void {
    const term = this.globalSearch.trim().toLowerCase();

    if (!term) {
      this.filteredOrders = [...this.orders];
      return;
    }

    this.filteredOrders = this.orders.filter(order => {
      return [
        order.id,
        order.customerName,
        order.productName,
        order.quantity,
        order.total,
        order.status,
        order.date
      ].join(' ').toLowerCase().includes(term);
    });
  }

  applyCustomerSearch(): void {
    const term = this.globalSearch.trim().toLowerCase();

    if (!term) {
      this.filteredCustomers = [...this.customers];
      return;
    }

    this.filteredCustomers = this.customers.filter(customer => {
      return [
        customer.name,
        customer.email,
        customer.phone,
        customer.company
      ].join(' ').toLowerCase().includes(term);
    });
  }

  applySupplierSearch(): void {
    const term = this.globalSearch.trim().toLowerCase();

    if (!term) {
      this.filteredSuppliers = [...this.suppliers];
      return;
    }

    this.filteredSuppliers = this.suppliers.filter(supplier => {
      return [
        supplier.name,
        supplier.material,
        supplier.contact
      ].join(' ').toLowerCase().includes(term);
    });
  }

  // =========================
  // PRODUCTS
  // =========================

  goToCreateProduct(): void {
    this.router.navigate(['/create-product']);
  }

  openProductModal(product?: any): void {
    if (product) {
      this.editingProductId = product.id;
      this.productForm = {
        name: product.name || '',
        description: product.description || '',
        price: Number(product.price || 0),
        stock: this.getStock(product)
      };
    } else {
      this.editingProductId = null;
      this.productForm = {
        name: '',
        description: '',
        price: null,
        stock: null
      };
    }

    this.modal = 'product';
  }

  saveProduct(): void {
    if (!this.productForm.name || !this.productForm.price || this.productForm.stock === null) {
      this.showToast('Please fill product name, price and stock.', true);
      return;
    }

    const existingProduct = this.products.find(item => item.id === this.editingProductId);

    const product = {
      id: this.editingProductId || Date.now(),
      name: this.productForm.name,
      description: this.productForm.description,
      price: Number(this.productForm.price),
      stock: Number(this.productForm.stock),
      stockQuantity: Number(this.productForm.stock),
      icon: existingProduct?.icon || 'fas fa-industry'
    };

    if (this.editingProductId) {
      const index = this.products.findIndex(item => item.id === this.editingProductId);

      if (index !== -1) {
        this.products[index] = product;
      }
    } else {
      this.products.unshift(product);
    }

    this.persistAll();
    this.applyProductSearch();
    this.closeModal();
    this.showToast('Product saved locally. Backend edit connection can be added later.');
  }

  deleteProduct(id: number): void {
    this.products = this.products.filter(product => product.id !== id);
    this.persistAll();
    this.applyProductSearch();
    this.showToast('Product removed locally.');
  }

  // =========================
  // ORDERS
  // =========================

  openOrderModal(): void {
    this.orderForm = {
      productId: null,
      customerId: null,
      quantity: null
    };

    this.modal = 'order';
  }

  saveOrder(): void {
    if (!this.orderForm.productId || !this.orderForm.customerId || !this.orderForm.quantity) {
      this.showToast('Please select product, customer and quantity.', true);
      return;
    }

    const product = this.products.find(item => Number(item.id) === Number(this.orderForm.productId));
    const customer = this.customers.find(item => Number(item.id) === Number(this.orderForm.customerId));

    if (!product || !customer) {
      this.showToast('Invalid product or customer.', true);
      return;
    }

    const stock = this.getStock(product);
    const quantity = Number(this.orderForm.quantity);

    if (stock < quantity) {
      this.showToast('Insufficient stock.', true);
      return;
    }

    product.stock = stock - quantity;
    product.stockQuantity = product.stock;

    const total = Number(product.price || 0) * quantity;

    this.orders.push({
      id: this.getNextId(this.orders),
      customerId: customer.id,
      customerName: customer.name,
      productId: product.id,
      productName: product.name,
      quantity,
      total,
      status: 'Pending',
      date: new Date().toISOString().slice(0, 10)
    });

    this.persistAll();
    this.refreshComputedData();
    this.closeModal();
    this.showToast('Order created locally.');
  }

  openStatusModal(order: any): void {
    this.editingOrderId = order.id;
    this.statusForm.status = order.status || 'Pending';
    this.modal = 'status';
  }

  saveOrderStatus(): void {
    const order = this.orders.find(item => item.id === this.editingOrderId);

    if (order) {
      order.status = this.statusForm.status;
      this.persistAll();
      this.applyOrderSearch();
      this.showToast('Order status updated.');
    }

    this.closeModal();
  }

  deleteOrder(id: number): void {
    this.orders = this.orders.filter(order => order.id !== id);
    this.persistAll();
    this.applyOrderSearch();
    this.showToast('Order removed.');
  }

  // =========================
  // WAREHOUSES
  // =========================

  openWarehouseModal(): void {
    this.warehouseForm = {
      name: '',
      location: '',
      capacity: null
    };

    this.modal = 'warehouse';
  }

  saveWarehouse(): void {
    if (!this.warehouseForm.name || !this.warehouseForm.location || !this.warehouseForm.capacity) {
      this.showToast('Please fill warehouse details.', true);
      return;
    }

    this.warehouses.push({
      id: this.getNextId(this.warehouses),
      name: this.warehouseForm.name,
      location: this.warehouseForm.location,
      capacity: Number(this.warehouseForm.capacity),
      used: 0
    });

    this.persistAll();
    this.closeModal();
    this.showToast('Warehouse added locally.');
  }

  deleteWarehouse(id: number): void {
    this.warehouses = this.warehouses.filter(item => item.id !== id);
    this.persistAll();
    this.showToast('Warehouse removed.');
  }

  // =========================
  // CUSTOMERS
  // =========================

  openCustomerModal(): void {
    this.customerForm = {
      name: '',
      email: '',
      phone: '',
      company: ''
    };

    this.modal = 'customer';
  }

  saveCustomer(): void {
    if (!this.customerForm.name || !this.customerForm.email) {
      this.showToast('Customer name and email are required.', true);
      return;
    }

    this.customers.push({
      id: this.getNextId(this.customers),
      ...this.customerForm
    });

    this.persistAll();
    this.applyCustomerSearch();
    this.closeModal();
    this.showToast('Customer added locally.');
  }

  deleteCustomer(id: number): void {
    this.customers = this.customers.filter(item => item.id !== id);
    this.persistAll();
    this.applyCustomerSearch();
    this.showToast('Customer removed.');
  }

  // =========================
  // SUPPLIERS
  // =========================

  openSupplierModal(): void {
    this.supplierForm = {
      name: '',
      material: '',
      contact: ''
    };

    this.modal = 'supplier';
  }

  saveSupplier(): void {
    if (!this.supplierForm.name || !this.supplierForm.material) {
      this.showToast('Supplier name and material are required.', true);
      return;
    }

    this.suppliers.push({
      id: this.getNextId(this.suppliers),
      ...this.supplierForm
    });

    this.persistAll();
    this.applySupplierSearch();
    this.closeModal();
    this.showToast('Supplier added locally.');
  }

  deleteSupplier(id: number): void {
    this.suppliers = this.suppliers.filter(item => item.id !== id);
    this.persistAll();
    this.applySupplierSearch();
    this.showToast('Supplier removed.');
  }

  // =========================
  // SETTINGS / IMPORT EXPORT
  // =========================

  setStockThreshold(value: string): void {
    this.stockThreshold = value ? Number(value) : 25;
    localStorage.setItem('stockThreshold', String(this.stockThreshold));
  }

  toggleDarkMode(checked: boolean): void {
    this.darkMode = checked;
    localStorage.setItem('nexus_dark_mode', String(checked));

    if (checked) {
      this.renderer.addClass(document.body, 'dark-mode');
    } else {
      this.renderer.removeClass(document.body, 'dark-mode');
    }
  }

  resetDemoData(): void {
    const ok = confirm('Reset demo dashboard data?');

    if (!ok) {
      return;
    }

    localStorage.removeItem('nexus_products');
    localStorage.removeItem('nexus_orders');
    localStorage.removeItem('nexus_warehouses');
    localStorage.removeItem('nexus_customers');
    localStorage.removeItem('nexus_suppliers');

    this.loadLocalMockData();
    this.refreshComputedData();
    this.showToast('Demo data reset.');
  }

  generateSampleData(): void {
    for (let i = 0; i < 5; i++) {
      const stock = Math.floor(Math.random() * 200);

      this.products.push({
        id: Date.now() + i,
        name: `Sample Part ${i + 1}`,
        description: 'Auto-generated sample product',
        price: Math.floor(Math.random() * 15000) + 500,
        stock,
        stockQuantity: stock,
        icon: 'fas fa-cog'
      });
    }

    this.persistAll();
    this.applyProductSearch();
    this.showToast('5 sample products added.');
  }

  exportData(): void {
    const data = {
      products: this.products,
      orders: this.orders,
      warehouses: this.warehouses,
      customers: this.customers,
      suppliers: this.suppliers
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'nexus_manufacturer_backup.json';
    anchor.click();

    URL.revokeObjectURL(url);
    this.showToast('Data exported.');
  }

  openImportModal(): void {
    this.modal = 'import';
  }

  importData(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'));

        this.products = Array.isArray(data.products) ? data.products : this.products;
        this.orders = Array.isArray(data.orders) ? data.orders : this.orders;
        this.warehouses = Array.isArray(data.warehouses) ? data.warehouses : this.warehouses;
        this.customers = Array.isArray(data.customers) ? data.customers : this.customers;
        this.suppliers = Array.isArray(data.suppliers) ? data.suppliers : this.suppliers;

        this.persistAll();
        this.refreshComputedData();
        this.closeModal();
        this.showToast('Import successful.');
      } catch {
        this.showToast('Invalid JSON file.', true);
      }
    };

    reader.readAsText(file);
  }

  // =========================
  // MODALS + FORM SETTERS
  // =========================

  closeModal(): void {
    this.modal = '';
    this.editingProductId = null;
    this.editingOrderId = null;
  }

  closeModalOnBackdrop(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.classList.contains('modal')) {
      this.closeModal();
    }
  }

  setProductName(value: string): void {
    this.productForm.name = value;
  }

  setProductDescription(value: string): void {
    this.productForm.description = value;
  }

  setProductPrice(value: string): void {
    this.productForm.price = value ? Number(value) : null;
  }

  setProductStock(value: string): void {
    this.productForm.stock = value ? Number(value) : null;
  }

  setOrderProductId(value: string): void {
    this.orderForm.productId = value ? Number(value) : null;
  }

  setOrderCustomerId(value: string): void {
    this.orderForm.customerId = value ? Number(value) : null;
  }

  setOrderQuantity(value: string): void {
    this.orderForm.quantity = value ? Number(value) : null;
  }

  setWarehouseName(value: string): void {
    this.warehouseForm.name = value;
  }

  setWarehouseLocation(value: string): void {
    this.warehouseForm.location = value;
  }

  setWarehouseCapacity(value: string): void {
    this.warehouseForm.capacity = value ? Number(value) : null;
  }

  setCustomerName(value: string): void {
    this.customerForm.name = value;
  }

  setCustomerEmail(value: string): void {
    this.customerForm.email = value;
  }

  setCustomerPhone(value: string): void {
    this.customerForm.phone = value;
  }

  setCustomerCompany(value: string): void {
    this.customerForm.company = value;
  }

  setSupplierName(value: string): void {
    this.supplierForm.name = value;
  }

  setSupplierMaterial(value: string): void {
    this.supplierForm.material = value;
  }

  setSupplierContact(value: string): void {
    this.supplierForm.contact = value;
  }

  setStatus(value: string): void {
    this.statusForm.status = value;
  }

  // =========================
  // HELPERS
  // =========================

  
getSectionLabel(section: ManufacturerSection): string {
    const labels: Record<ManufacturerSection, string> = {
      dashboard: 'Dashboard',
      products: 'Products',
      orders: 'Orders',
      warehouses: 'Warehouses',
      analytics: 'Analytics',
      finance: 'Finance',
      customers: 'Customers',
      suppliers: 'Suppliers',
      settings: 'Settings'
    };

    return labels[section];
  }


  productInventoryValue(product: any): number {
    return Number(product.price || 0) * this.getStock(product);
  }

  formatCurrency(value: any): string {
    return '₹' + Number(value || 0).toLocaleString('en-IN');
  }

  getNextId(items: any[]): number {
    if (!items.length) {
      return 1;
    }

    return Math.max(...items.map(item => Number(item.id || 0))) + 1;
  }

  getStock(product: any): number {
    return Number(product.stock ?? product.stockQuantity ?? 0);
  }

  getUsagePercentage(warehouse: any): number {
    if (!warehouse.capacity) {
      return 0;
    }

    return Math.round((Number(warehouse.used || 0) / Number(warehouse.capacity)) * 100);
  }

  getTrendWidth(value: number): string {
    return Math.min(100, Math.max(5, value)) + '%';
  }

  showToast(message: string, isError: boolean = false): void {
    this.notificationMessage = message;
    this.notificationError = isError;
    this.notificationVisible = true;

    clearTimeout(this.notificationTimer);

    this.notificationTimer = setTimeout(() => {
      this.notificationVisible = false;
    }, 2800);
  }
}