
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
  filteredInventories: any[] = [];
  orders: any[] = [];

  activeSection: 'dashboard' | 'browse' | 'orders' | 'analytics' = 'dashboard';
  sidebarOpen = false;
  isDarkMode = false;

  loadingInventory = false;
  loadingOrders = false;

  inventorySearch = '';

  toastMessage = '';
  toastVisible = false;
  toastError = false;

  confirmVisible = false;
  confirmTitle = '';
  confirmMessage = '';
  private confirmCallback: (() => void) | null = null;

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

  switchSection(section: 'dashboard' | 'browse' | 'orders' | 'analytics'): void {
    this.activeSection = section;
    this.closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeSidebar(): void { this.sidebarOpen = false; }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('nexus_dark_mode', String(this.isDarkMode));
  }

  refresh(): void { this.loadInventories(); this.loadOrders(); }

  loadInventories(): void {
    this.loadingInventory = true;
    this.http.getInventoriesForConsumers().subscribe({
      next: (res: any) => {
        this.inventories = Array.isArray(res) ? res : [];
        this.filteredInventories = [...this.inventories];
        this.loadingInventory = false;
      },
      error: () => { this.inventories = []; this.filteredInventories = []; this.loadingInventory = false; this.showToast('Unable to load inventory.', true); }
    });
  }

  loadOrders(): void {
    if (!this.userId) return;
    this.loadingOrders = true;
    this.http.getOrderConsumer(this.userId).subscribe({
      next: (res: any) => {
        this.orders = Array.isArray(res) ? res : [];
        this.loadingOrders = false;
      },
      error: () => { this.orders = []; this.loadingOrders = false; this.showToast('Unable to load orders.', true); }
    });
  }

  /* ═══ GETTERS ═══ */

  getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '';
  }

  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  return `${window.location.origin}/project/3689/proxy/3000${imageUrl}`;
}
  get inventoryCount(): number { return this.inventories.length; }
  get orderCount(): number { return this.orders.length; }
  get pendingOrders(): number { return this.orders.filter(o => this.normalizeStatus(o.status) === 'PENDING').length; }
  get shippedOrders(): number { return this.orders.filter(o => this.normalizeStatus(o.status) === 'SHIPPED').length; }
  get deliveredOrders(): number { return this.orders.filter(o => this.normalizeStatus(o.status) === 'DELIVERED').length; }
  get cancelledOrders(): number { return this.orders.filter(o => this.normalizeStatus(o.status) === 'CANCELLED').length; }

  get totalSpent(): number {
    return this.orders.filter(o => this.normalizeStatus(o.status) === 'DELIVERED')
      .reduce((s, o) => s + Number(o.product?.price || o.price || 0) * Number(o.quantity || 0), 0);
  }
  get avgOrderValue(): number {
    if (this.orderCount === 0) return 0;
    const total = this.orders.reduce((s, o) => s + Number(o.product?.price || o.price || 0) * Number(o.quantity || 0), 0);
    return Math.round(total / this.orderCount);
  }
  get totalUnitsOrdered(): number {
    return this.orders.reduce((s, o) => s + Number(o.quantity || 0), 0);
  }
  get fulfilmentRate(): number {
    if (this.orderCount === 0) return 0;
    return (this.deliveredOrders / this.orderCount) * 100;
  }
  get uniqueProducts(): number {
    const set = new Set(this.orders.map(o => String(o.product?.id || o.productId || '')));
    return set.size;
  }
  get mostOrderedProduct(): { name: string; qty: number } {
    if (!this.orders.length) return { name: 'No orders yet', qty: 0 };
    const map: any = {};
    this.orders.forEach(o => {
      const k = String(o.product?.id || o.productId || 'u');
      if (!map[k]) map[k] = { name: o.product?.name || o.productName || 'Unknown', qty: 0 };
      map[k].qty += Number(o.quantity || 0);
    });
    return (Object.values(map) as any[]).sort((a, b) => b.qty - a.qty)[0] || { name: 'N/A', qty: 0 };
  }

  /* ═══ PURE CSS CHART DATA ═══ */
  get statusChartData(): { label: string; value: number; color: string; percent: number }[] {
    const total = this.orderCount || 1;
    return [
      { label: 'Pending', value: this.pendingOrders, color: '#f59e0b', percent: (this.pendingOrders / total) * 100 },
      { label: 'Shipped', value: this.shippedOrders, color: '#3b82f6', percent: (this.shippedOrders / total) * 100 },
      { label: 'Delivered', value: this.deliveredOrders, color: '#22c55e', percent: (this.deliveredOrders / total) * 100 },
      { label: 'Cancelled', value: this.cancelledOrders, color: '#ef4444', percent: (this.cancelledOrders / total) * 100 },
    ].filter(d => d.value > 0);
  }
  get statusGradient(): string {
    const data = this.statusChartData;
    if (!data.length) return 'conic-gradient(#e2e8f0 0% 100%)';
    let cum = 0;
    const stops = data.map(d => { const s = `${d.color} ${cum}% ${cum + d.percent}%`; cum += d.percent; return s; });
    return `conic-gradient(${stops.join(', ')})`;
  }

  get spendingByProductData(): { name: string; value: number; percent: number; color: string }[] {
    const map: any = {};
    this.orders.forEach(o => {
      const k = String(o.product?.id || o.productId || 'u');
      if (!map[k]) map[k] = { name: o.product?.name || o.productName || 'Unknown', value: 0 };
      map[k].value += Number(o.product?.price || o.price || 0) * Number(o.quantity || 0);
    });
    const sorted = (Object.values(map) as any[]).sort((a, b) => b.value - a.value).slice(0, 8);
    const mx = sorted.length ? sorted[0].value : 1;
    const colors = ['#4f46e5', '#6366f1', '#818cf8', '#06b6d4', '#22d3ee', '#10b981', '#f59e0b', '#7c3aed'];
    return sorted.map((i, idx) => ({ name: i.name, value: i.value, percent: Math.round((i.value / mx) * 100), color: colors[idx % colors.length] }));
  }

  get qtyByProductData(): { name: string; qty: number; percent: number; color: string }[] {
    const map: any = {};
    this.orders.forEach(o => {
      const k = String(o.product?.id || o.productId || 'u');
      if (!map[k]) map[k] = { name: o.product?.name || o.productName || 'Unknown', qty: 0 };
      map[k].qty += Number(o.quantity || 0);
    });
    const sorted = (Object.values(map) as any[]).sort((a, b) => b.qty - a.qty).slice(0, 8);
    const mx = sorted.length ? sorted[0].qty : 1;
    const colors = ['#7c3aed', '#a78bfa', '#c4b5fd', '#22c55e', '#4ade80', '#86efac', '#06b6d4', '#67e8f9'];
    return sorted.map((i, idx) => ({ name: i.name, qty: i.qty, percent: Math.round((i.qty / mx) * 100), color: colors[idx % colors.length] }));
  }

  get spendingShareData(): { name: string; value: number; color: string; percent: number }[] {
    const map: any = {};
    this.orders.forEach(o => {
      const k = String(o.product?.id || o.productId || 'u');
      if (!map[k]) map[k] = { name: o.product?.name || o.productName || 'Unknown', value: 0 };
      map[k].value += Number(o.product?.price || o.price || 0) * Number(o.quantity || 0);
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
  get spendingShareGradient(): string {
    const data = this.spendingShareData;
    if (!data.length) return 'conic-gradient(#e2e8f0 0% 100%)';
    let cum = 0;
    const stops = data.map(d => { const s = `${d.color} ${cum}% ${cum + d.percent}%`; cum += d.percent; return s; });
    return `conic-gradient(${stops.join(', ')})`;
  }

  /* ═══ SEARCH ═══ */
  onInventorySearch(v: string): void { this.inventorySearch = v; this.applySearch(); }
  clearSearch(): void { this.inventorySearch = ''; this.applySearch(); }
private applySearch(): void {
  const q = this.inventorySearch.trim().toLowerCase();

  if (!q) {
    this.filteredInventories = [...this.inventories];
    return;
  }

  this.filteredInventories = this.inventories.filter(i =>
    [
      i.id,
      i.product?.name,
      i.product?.description,
      i.product?.price,
      i.stockQuantity,
      i.wholesalerId
    ]
      .map(v => String(v ?? '').toLowerCase())
      .join(' ')
      .includes(q)
  );
}
  /* ═══ NAVIGATION ═══ */
  goToPlaceOrder(): void { this.router.navigate(['/consumer-place-order']); }
  goToOrders(): void { this.router.navigate(['/consumer-get-orders']); }

  confirmLogout(): void {
    this.confirmTitle = 'Confirm Logout';
    this.confirmMessage = 'Are you sure you want to logout?';
    this.confirmCallback = () => this.sessionService.logoutManually();
    this.confirmVisible = true;
  }
  onConfirmYes(): void { this.confirmVisible = false; if (this.confirmCallback) { this.confirmCallback(); this.confirmCallback = null; } }
  onConfirmCancel(): void { this.confirmVisible = false; this.confirmCallback = null; }

  /* ═══ UTILS ═══ */
  normalizeStatus(s: string): string { return String(s || 'PENDING').toUpperCase(); }
  getStatusClass(s: string): string {
    const n = this.normalizeStatus(s);
    return n === 'SHIPPED' ? 'status-shipped' : n === 'DELIVERED' ? 'status-delivered' : n === 'CANCELLED' ? 'status-cancelled' : 'status-pending';
  }
  getStatusIcon(s: string): string {
    const n = this.normalizeStatus(s);
    return n === 'PENDING' ? 'schedule' : n === 'SHIPPED' ? 'local_shipping' : n === 'DELIVERED' ? 'check_circle' : 'cancel';
  }
  getProductName(o: any): string { return o?.product?.name || o?.productName || 'Unknown Product'; }
  getProductPrice(o: any): number { return Number(o?.product?.price || o?.price || 0); }
  getWholesalerName(o: any): string { return o?.wholesaler?.username || o?.wholesalerName || 'Wholesaler'; }
  formatCurrency(v: any): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v || 0));
  }
  showToast(msg: string, err = false): void {
    this.toastMessage = msg; this.toastError = err; this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3200);
  }
}
