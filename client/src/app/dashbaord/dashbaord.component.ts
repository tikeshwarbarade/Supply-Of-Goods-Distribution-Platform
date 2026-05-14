import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashbaord.component.html',
  styleUrls: ['./dashbaord.component.scss']
})
export class DashbaordComponent implements OnInit {

  role: string | null = null;

  searchText: string = '';
  currentSort: 'asc' | 'desc' | null = null;

  sortDropdownOpen: boolean = false;
  profileDropdownOpen: boolean = false;

  products: any[] = [];
  filteredProducts: any[] = [];

  openMenuProductId: number | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpService
  ) {}

  ngOnInit() {
    this.role = this.auth.getRole;

    if (this.role === 'MANUFACTURER') {
      this.loadManufacturerProducts();
    }
  }

  loadManufacturerProducts() {
    const userId = this.auth.getUserId();

    if (!userId) {
      this.products = [];
      this.filteredProducts = [];
      return;
    }

    this.http.getProductsByManufacturer(userId).subscribe({
      next: (res: any) => {
        this.products = Array.isArray(res) ? res : [];
        this.filteredProducts = [...this.products];
      },
      error: (err) => {
        console.error('Failed to load manufacturer products', err);
        this.products = [];
        this.filteredProducts = [];
      }
    });
  }

  onSearchInput(value: string) {
    this.searchText = value;
    this.applyFilters();
  }

  clearSearch() {
    this.searchText = '';
    this.applyFilters();
  }

  toggleSortDropdown() {
    this.sortDropdownOpen = !this.sortDropdownOpen;
    this.profileDropdownOpen = false;
    this.openMenuProductId = null;
  }

  applySort(direction: 'asc' | 'desc') {
    this.currentSort = direction;
    this.sortDropdownOpen = false;
    this.applyFilters();
  }

  applyFilters() {
    let list = [...this.products];

    const query = this.searchText.trim().toLowerCase();

    if (query) {
      list = list.filter(product =>
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }

    if (this.currentSort === 'asc') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    if (this.currentSort === 'desc') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    this.filteredProducts = list;
  }

  toggleProfileDropdown() {
    this.profileDropdownOpen = !this.profileDropdownOpen;
    this.sortDropdownOpen = false;
    this.openMenuProductId = null;
  }

  toggleCardMenu(productId: number) {
    this.openMenuProductId =
      this.openMenuProductId === productId ? null : productId;

    this.profileDropdownOpen = false;
    this.sortDropdownOpen = false;
  }

  editProduct(product: any) {
    this.openMenuProductId = null;

    // Current project has no separate /edit-product/:id route.
    // For now, navigate to existing create/update product component.
    this.router.navigate(['/create-product']);
  }

  deleteProduct(productId: number) {
    // No delete product backend API exists in current project requirement.
    // This is UI-only delete for now.
    this.products = this.products.filter(p => p.id !== productId);
    this.applyFilters();
    this.openMenuProductId = null;
  }

  increaseStock(product: any) {
    product.stockQuantity = Number(product.stockQuantity || 0) + 1;
  }

  decreaseStock(product: any) {
    product.stockQuantity = Math.max(0, Number(product.stockQuantity || 0) - 1);
  }

  goToCreateProduct() {
    this.router.navigate(['/create-product']);
  }

  goToPlaceOrder() {
    this.router.navigate(['/place-product']);
  }

  goToOrders() {
    this.router.navigate(['/get-orders']);
  }

  goToInventory() {
    this.router.navigate(['/add-inventory']);
  }

  goToConsumerPlaceOrder() {
    this.router.navigate(['/consumer-place-order']);
  }

  goToConsumerOrders() {
    this.router.navigate(['/consumer-get-orders']);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  formatPrice(price: number) {
    return '₹' + Number(price || 0).toLocaleString('en-IN');
  }
}