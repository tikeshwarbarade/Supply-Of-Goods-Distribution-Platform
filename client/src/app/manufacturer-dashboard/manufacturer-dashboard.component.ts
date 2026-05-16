
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
  activeSection: 'dashboard' | 'products' | 'orders' | 'analytics' = 'dashboard';
  sidebarOpen = false;
  isDarkMode = false;
  loadingProducts = false;
  loadingOrders = false;
  toastMessage = '';
  toastVisible = false;
  toastError = false;
  confirmVisible = false;
  confirmTitle = '';
  confirmMessage = '';
  private confirmCallback: (() => void) | null = null;
  readonly statuses: string[] = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  constructor(
    private auth: AuthService,
    private http: HttpService,
    private router: Router,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.userId = this.auth.getUserId();
    this.isDarkMode = localStorage.getItem('nexus_dark_mode') === 'true';
    this.refresh();
  }

  switchSection(section: 'dashboard' | 'products' | 'orders' | 'analytics'): void {
    this.activeSection = section;
    this.closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeSidebar(): void { this.sidebarOpen = false; }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('nexus_dark_mode', String(this.isDarkMode));
  }

  refresh(): void { this.loadProducts(); this.loadReceivedOrders(); }

  loadProducts(): void {
    if (!this.userId) { this.showToast('Session not found.', true); return; }
    this.loadingProducts = true;
    this.http.getProductsByManufacturer(this.userId).subscribe({
      next: (res: any) => {
        this.products = Array.isArray(res) ? res : [];
        this.filteredProducts = [...this.products];
        this.loadingProducts = false;
      },
      error: () => { this.products = []; this.filteredProducts = []; this.loadingProducts = false; this.showToast('Unable to load products.', true); }
    });
  }

  loadReceivedOrders(): void {
    if (!this.userId) return;
    this.loadingOrders = true;
    this.http.getOrdersByManufacturer(this.userId).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : [];
        this.receivedOrders = data.map((o: any) => ({ ...o, selectedStatus: this.normalizeStatus(o.status) }));
        this.loadingOrders = false;
      },
      error: () => { this.receivedOrders = []; this.loadingOrders = false; this.showToast('Unable to load orders.', true); }
    });
  }


  /* ═══ BASIC GETTERS ═══ */
  getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '';
  }

  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  return `${window.location.origin}/project/3689/proxy/3000${imageUrl}`;
}


  get productCount(): number { return this.products.length; }
  get totalStock(): number { return this.products.reduce((s, p) => s + Number(p.stockQuantity || 0), 0); }
  get inventoryValue(): number { return this.products.reduce((s, p) => s + Number(p.price || 0) * Number(p.stockQuantity || 0), 0); }
get lowStockCount(): number {
  return this.products.filter(p => Number(p.stockQuantity || 0) < 10).length;
}

  get lowStockProducts(): any[] { return this.products.filter(p => Number(p.stockQuantity || 0) < 10); }
  get receivedOrderCount(): number { return this.receivedOrders.length; }
  get pendingOrderCount(): number { return this.receivedOrders.filter(o => this.normalizeStatus(o.status) === 'PENDING').length; }
  get shippedOrderCount(): number { return this.receivedOrders.filter(o => this.normalizeStatus(o.status) === 'SHIPPED').length; }
  get deliveredOrderCount(): number { return this.receivedOrders.filter(o => this.normalizeStatus(o.status) === 'DELIVERED').length; }
  get cancelledOrderCount(): number { return this.receivedOrders.filter(o => this.normalizeStatus(o.status) === 'CANCELLED').length; }
  get unreadCount(): number { return this.pendingOrderCount + this.lowStockCount; }
  get inStockCount(): number { return this.products.filter(p => Number(p.stockQuantity || 0) >= 10).length; }
  get outOfStockCount(): number { return this.products.filter(p => Number(p.stockQuantity || 0) === 0).length; }
  get totalUnitsSold(): number { return this.receivedOrders.filter(o => this.normalizeStatus(o.status) === 'DELIVERED').reduce((s, o) => s + Number(o.quantity || 0), 0); }

  get totalRevenue(): number {
    return this.receivedOrders.filter(o => this.normalizeStatus(o.status) === 'DELIVERED')
      .reduce((s, o) => s + Number(o.product?.price || 0) * Number(o.quantity || 0), 0);
  }
  get avgOrderValue(): number {
    if (this.receivedOrderCount === 0) return 0;
    return Math.round(this.receivedOrders.reduce((s, o) => s + Number(o.product?.price || 0) * Number(o.quantity || 0), 0) / this.receivedOrderCount);
  }
  get fulfilmentRate(): number {
    if (this.receivedOrderCount === 0) return 0;
    return (this.deliveredOrderCount / this.receivedOrderCount) * 100;
  }
  get stockTurnover(): number {
    if (this.totalStock === 0) return 0;
    return this.totalUnitsSold / this.totalStock;
  }

  openProductDetails(product: any): void {
  this.editProduct(product);
}
  get highestValueProduct(): { name: string; value: number } {
    if (!this.products.length) return { name: 'No products', value: 0 };
    const sorted = [...this.products].sort((a, b) => (Number(b.price || 0) * Number(b.stockQuantity || 0)) - (Number(a.price || 0) * Number(a.stockQuantity || 0)));
    return { name: sorted[0].name || 'Unnamed', value: Number(sorted[0].price || 0) * Number(sorted[0].stockQuantity || 0) };
  }
  get mostOrderedProduct(): { name: string; qty: number } {
    if (!this.receivedOrders.length) return { name: 'No orders yet', qty: 0 };
    const map: any = {};
    this.receivedOrders.forEach(o => {
      const k = String(o.product?.id || 'u');
      if (!map[k]) map[k] = { name: o.product?.name || 'Unknown', qty: 0 };
      map[k].qty += Number(o.quantity || 0);
    });
    return (Object.values(map) as any[]).sort((a, b) => b.qty - a.qty)[0] || { name: 'N/A', qty: 0 };
  }
  get topProducts(): any[] {
    const map: any = {};
    this.receivedOrders.forEach((o: any) => {
      const pid = String(o.product?.id || 'u');
      if (!map[pid]) map[pid] = { name: o.product?.name || 'Unknown', totalQty: 0, revenue: 0 };
      map[pid].totalQty += Number(o.quantity || 0);
      map[pid].revenue += Number(o.product?.price || 0) * Number(o.quantity || 0);
    });
    const arr = (Object.values(map) as any[]).sort((a, b) => b.totalQty - a.totalQty).slice(0, 5);
    const mx = arr.length ? arr[0].totalQty : 1;
    return arr.map(i => ({ ...i, barPercent: Math.round((i.totalQty / mx) * 100) }));
  }

  /* ═══════════════════════════════════════════════════════
     PURE CSS CHART DATA — NO CHART.JS
     ═══════════════════════════════════════════════════════ */

  // 1. Order Status Donut
  get statusChartData(): { label: string; value: number; color: string; percent: number }[] {
    const total = this.receivedOrderCount || 1;
    return [
      { label: 'Pending', value: this.pendingOrderCount, color: '#f59e0b', percent: (this.pendingOrderCount / total) * 100 },
      { label: 'Shipped', value: this.shippedOrderCount, color: '#3b82f6', percent: (this.shippedOrderCount / total) * 100 },
      { label: 'Delivered', value: this.deliveredOrderCount, color: '#22c55e', percent: (this.deliveredOrderCount / total) * 100 },
      { label: 'Cancelled', value: this.cancelledOrderCount, color: '#ef4444', percent: (this.cancelledOrderCount / total) * 100 },
    ].filter(d => d.value > 0);
  }

  get statusGradient(): string {
    const data = this.statusChartData;
    if (!data.length) return 'conic-gradient(#e2e8f0 0% 100%)';
    let cum = 0;
    const stops = data.map(d => { const s = `${d.color} ${cum}% ${cum + d.percent}%`; cum += d.percent; return s; });
    return `conic-gradient(${stops.join(', ')})`;
  }

  // 2. Revenue by Product (Bar)
  get revenueByProductData(): { name: string; value: number; percent: number; color: string }[] {
    const map: any = {};
    this.receivedOrders.forEach(o => {
      const k = String(o.product?.id || 'u');
      if (!map[k]) map[k] = { name: o.product?.name || 'Unknown', value: 0 };
      map[k].value += Number(o.product?.price || 0) * Number(o.quantity || 0);
    });
    const sorted = (Object.values(map) as any[]).sort((a, b) => b.value - a.value).slice(0, 8);
    const mx = sorted.length ? sorted[0].value : 1;
    const colors = ['#4f46e5', '#6366f1', '#818cf8', '#06b6d4', '#22d3ee', '#10b981', '#f59e0b', '#7c3aed'];
    return sorted.map((i, idx) => ({ name: i.name, value: i.value, percent: Math.round((i.value / mx) * 100), color: colors[idx % colors.length] }));
  }

  // 3. Stock Health Donut
  get stockHealthData(): { label: string; value: number; color: string; percent: number }[] {
    const total = this.productCount || 1;
    return [
      { label: 'In Stock', value: this.inStockCount, color: '#22c55e', percent: (this.inStockCount / total) * 100 },
      { label: 'Low Stock', value: this.lowStockCount, color: '#f59e0b', percent: (this.lowStockCount / total) * 100 },
      { label: 'Out of Stock', value: this.outOfStockCount, color: '#ef4444', percent: (this.outOfStockCount / total) * 100 },
    ].filter(d => d.value > 0);
  }

  get stockHealthGradient(): string {
    const data = this.stockHealthData;
    if (!data.length) return 'conic-gradient(#e2e8f0 0% 100%)';
    let cum = 0;
    const stops = data.map(d => { const s = `${d.color} ${cum}% ${cum + d.percent}%`; cum += d.percent; return s; });
    return `conic-gradient(${stops.join(', ')})`;
  }

  // 4. Inventory Value by Product (Horizontal Bar)
  get inventoryValueData(): { name: string; value: number; percent: number; color: string }[] {
    const sorted = [...this.products]
      .map(p => ({ name: p.name || 'Unnamed', value: Number(p.price || 0) * Number(p.stockQuantity || 0) }))
      .filter(p => p.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);
    const mx = sorted.length ? sorted[0].value : 1;
    const colors = ['#06b6d4', '#0891b2', '#22d3ee', '#4f46e5', '#6366f1', '#818cf8', '#7c3aed', '#a78bfa'];
    return sorted.map((i, idx) => ({ name: i.name, value: i.value, percent: Math.round((i.value / mx) * 100), color: colors[idx % colors.length] }));
  }

  // 5. Revenue Share Pie
  get revenueShareData(): { name: string; value: number; color: string; percent: number }[] {
    const map: any = {};
    this.receivedOrders.forEach(o => {
      const k = String(o.product?.id || 'u');
      if (!map[k]) map[k] = { name: o.product?.name || 'Unknown', value: 0 };
      map[k].value += Number(o.product?.price || 0) * Number(o.quantity || 0);
    });
    const sorted = (Object.values(map) as any[]).sort((a, b) => b.value - a.value);
    const total = sorted.reduce((s: number, i: any) => s + i.value, 0) || 1;
    const top5 = sorted.slice(0, 5);
    const othersVal = sorted.slice(5).reduce((s: number, i: any) => s + i.value, 0);
    const colors = ['#4f46e5', '#06b6d4', '#7c3aed', '#22c55e', '#f59e0b', '#94a3b8'];
    const result = top5.map((i: any, idx: number) => ({ name: i.name, value: i.value, color: colors[idx], percent: (i.value / total) * 100 }));
    if (othersVal > 0) result.push({ name: 'Others', value: othersVal, color: '#94a3b8', percent: (othersVal / total) * 100 });
    return result;
  }

  get revenueShareGradient(): string {
    const data = this.revenueShareData;
    if (!data.length) return 'conic-gradient(#e2e8f0 0% 100%)';
    let cum = 0;
    const stops = data.map(d => { const s = `${d.color} ${cum}% ${cum + d.percent}%`; cum += d.percent; return s; });
    return `conic-gradient(${stops.join(', ')})`;
  }

  // 6. Order Qty by Product (Bar)
  get orderQtyData(): { name: string; qty: number; percent: number; color: string }[] {
    const map: any = {};
    this.receivedOrders.forEach(o => {
      const k = String(o.product?.id || 'u');
      if (!map[k]) map[k] = { name: o.product?.name || 'Unknown', qty: 0 };
      map[k].qty += Number(o.quantity || 0);
    });
    const sorted = (Object.values(map) as any[]).sort((a, b) => b.qty - a.qty).slice(0, 8);
    const mx = sorted.length ? sorted[0].qty : 1;
    const colors = ['#7c3aed', '#a78bfa', '#c4b5fd', '#22c55e', '#4ade80', '#86efac', '#06b6d4', '#67e8f9'];
    return sorted.map((i, idx) => ({ name: i.name, qty: i.qty, percent: Math.round((i.qty / mx) * 100), color: colors[idx % colors.length] }));
  }

  /* ═══ SEARCH ═══ */
  onProductSearch(v: string): void { this.productSearch = v; this.applyProductSearch(); }
  clearSearch(): void { this.productSearch = ''; this.applyProductSearch(); }
  private applyProductSearch(): void {
    const q = this.productSearch.trim().toLowerCase();
    if (!q) { this.filteredProducts = [...this.products]; return; }
    this.filteredProducts = this.products.filter(p =>
      [p.id, p.name, p.description, p.price, p.stockQuantity].map(v => String(v ?? '').toLowerCase()).join(' ').includes(q)
    );
  }

  /* ═══ ORDER UPDATE ═══ */
  updateReceivedOrderStatus(order: any): void {
    const status = order.selectedStatus || 'PENDING';
    this.http.updateManufacturerOrderStatus(order.id, status).subscribe({
      next: () => { this.showToast(`Order #${order.id} updated to ${status}.`); this.loadReceivedOrders(); this.loadProducts(); },
      error: (err: any) => this.showToast(err?.error?.message || 'Failed to update.', true)
    });
  }

  /* ═══ NAVIGATION ═══ */
  goToCreateProduct(): void { this.router.navigate(['/create-product']); }
  editProduct(p: any): void { this.router.navigate(['/create-product'], { queryParams: { editProductId: p.id } }); }
  confirmLogout(): void {
    this.confirmTitle = 'Confirm Logout'; this.confirmMessage = 'Are you sure?';
    this.confirmCallback = () => this.sessionService.logoutManually(); this.confirmVisible = true;
  }
  onConfirmYes(): void { this.confirmVisible = false; if (this.confirmCallback) { this.confirmCallback(); this.confirmCallback = null; } }
  onConfirmCancel(): void { this.confirmVisible = false; this.confirmCallback = null; }

  /* ═══ UTILS ═══ */
  normalizeStatus(s: string): string { return String(s || 'PENDING').toUpperCase(); }
  getStatusClass(s: string): string {
    const n = this.normalizeStatus(s);
    return n === 'SHIPPED' ? 'status-shipped' : n === 'DELIVERED' ? 'status-delivered' : n === 'CANCELLED' ? 'status-cancelled' : 'status-pending';
  }
  getProductName(p: any): string { return p ? (p.name || `Product #${p.id || 'N/A'}`) : 'N/A'; }
  getWholesalerName(u: any): string { return u ? (u.username || u.email || `User #${u.id}`) : 'Wholesaler'; }
  getStockPercent(p: any): number {
    const s = Number(p?.stockQuantity ?? 0);
    const avg = this.totalStock > 0 && this.productCount > 0 ? (this.totalStock / this.productCount) : 100;
    return Math.min(Math.round((s / Math.max(avg, 1)) * 100), 100);
  }
  getStockStatusLabel(qty: number): string { return qty === 0 ? 'Out of Stock' : qty < 10 ? 'Low Stock' : 'In Stock'; }
  formatCurrency(v: any): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v || 0));
  }
  showToast(msg: string, err = false): void {
    this.toastMessage = msg; this.toastError = err; this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3200);
  }
}


