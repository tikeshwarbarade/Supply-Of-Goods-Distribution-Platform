
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-consumer-place-order',
  templateUrl: './consumer-place-order.component.html',
  styleUrls: ['./consumer-place-order.component.scss']
})
export class ConsumerPlaceOrderComponent implements OnInit {

  userId: number | null = null;

  inventories: any[] = [];
  filteredInventories: any[] = [];

  searchText = '';

  selectedInventoryId: number | null = null;
  orderQuantity: number | null = null;

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
    this.loadInventories();
  }

  loadInventories(): void {
    this.loading = true;

    this.http.getInventoriesForConsumers().subscribe({
      next: (res: any) => {
        this.inventories = Array.isArray(res) ? res : [];
        this.filteredInventories = [...this.inventories];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load inventories', err);
        this.inventories = [];
        this.filteredInventories = [];
        this.loading = false;
        this.setMessage('Unable to load wholesaler inventory.', true);
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

  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  return `${window.location.origin}/project/3689/proxy/3000${cleanPath}`;
}

  onSearch(value: string): void {
    this.searchText = value;
    this.applySearch();
  }

  clearSearch(): void {
    this.searchText = '';
    this.applySearch();
  }

  applySearch(): void {
    const query = this.searchText.trim().toLowerCase();

    if (!query) {
      this.filteredInventories = [...this.inventories];
      return;
    }

    this.filteredInventories = this.inventories.filter(inv => {
      return [
        inv.id,
        inv.wholesalerId,
        inv.stockQuantity,
        inv.product?.id,
        inv.product?.name,
        inv.product?.description,
        inv.product?.price
      ]
        .map(value => String(value ?? '').toLowerCase())
        .join(' ')
        .includes(query);
    });
  }

  selectInventory(inventory: any): void {
    this.selectedInventoryId = inventory.id;
    this.orderQuantity = null;
    this.setMessage(`${inventory.product?.name || 'Product'} selected. Enter quantity and place order.`, false);
  }

  setOrderQuantity(value: string): void {
    this.orderQuantity = value ? Number(value) : null;
  }

  placeOrder(): void {
    if (!this.userId) {
      this.setMessage('User session not found.', true);
      return;
    }

    if (!this.selectedInventoryId) {
      this.setMessage('Please select an inventory item.', true);
      return;
    }

    if (!this.orderQuantity || this.orderQuantity <= 0) {
      this.setMessage('Please enter valid order quantity.', true);
      return;
    }

    const inventory = this.inventories.find(item => Number(item.id) === Number(this.selectedInventoryId));

    if (!inventory) {
      this.setMessage('Selected inventory not found.', true);
      return;
    }

    if (Number(inventory.stockQuantity || 0) < this.orderQuantity) {
      this.setMessage('Quantity exceeds available wholesaler stock.', true);
      return;
    }

    const payload = {
      quantity: this.orderQuantity,
      status: 'PENDING'
    };

    this.submitting = true;

    this.http.consumerPlaceInventoryOrder(payload, this.selectedInventoryId, this.userId).subscribe({
      next: () => {
        this.submitting = false;
        this.setMessage('Order placed successfully. Status is PENDING.', false);
        this.selectedInventoryId = null;
        this.orderQuantity = null;
        this.loadInventories();
      },
      error: (err) => {
        console.error('Consumer inventory order failed', err);
        this.submitting = false;

        const backendMessage =
          err?.error?.message ||
          err?.error?.error ||
          'Failed to place order.';

        this.setMessage(backendMessage, true);
      }
    });
  }

  getSelectedInventory(): any {
    return this.inventories.find(item => Number(item.id) === Number(this.selectedInventoryId));
  }

  formatCurrency(value: any): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  setMessage(message: string, isError: boolean): void {
    this.message = message;
    this.messageError = isError;
  }

  goBack(): void {
    this.router.navigate(['/consumer-dashboard']);
  }
}
