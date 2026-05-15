// import { Component } from "@angular/core";
// import { Validators, FormBuilder } from "@angular/forms";
// import { HttpService } from "../../services/http.service";

// @Component({ selector: 'app-create-products', template: '' })
// export class CreateProductsComponent {

//   products:any[] = [];

// ngOnInit() {
//   let id = Number(localStorage.getItem('userId'));

//   this.http.getProductsByManufacturer(id)
//     .subscribe((res:any)=> this.products = res);
// }

// editProduct(p:any) {
//   this.itemForm.patchValue(p);
// }
// itemForm = this.fb.group({
//   name: [null as any, Validators.required],
//   description: [null as any, Validators.required],
//   price: [null as any, Validators.required],
//   stockQuantity: [null as any, Validators.required]
// });

//   constructor(private fb: FormBuilder,
//               private http: HttpService) {}

//  submit() {
//   if (this.itemForm.invalid) return;

//   let data: any = this.itemForm.value;
//   data.manufacturerId = Number(localStorage.getItem('userId'));

//   this.http.createProduct(data).subscribe();
// }

// onSubmit() {
//   this.submit();   // ✅ REQUIRED
// }
// }

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-create-products',
  templateUrl: './create-products.component.html',
  styleUrls: ['./create-products.component.scss']
})
export class CreateProductsComponent implements OnInit {

  itemForm!: FormGroup;

  userId: number | null = null;

  products: any[] = [];
  filteredProducts: any[] = [];

  editingProductId: number | null = null;

  productSearch = '';

  loading = false;
  submitting = false;

  formMessage = '';
  formMessageError = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private http: HttpService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userId = this.auth.getUserId();

    this.itemForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(1)]],
      stockQuantity: [null, [Validators.required, Validators.min(0)]]
    });

    this.loadProducts();

    this.route.queryParams.subscribe(params => {
      const editId = params['editProductId'];

      if (editId) {
        const numericId = Number(editId);

        setTimeout(() => {
          const product = this.products.find(item => Number(item.id) === numericId);

          if (product) {
            this.editProduct(product);
          }
        }, 600);
      }
    });
  }

  // =========================
  // LOAD PRODUCTS
  // =========================

  loadProducts(): void {
    if (!this.userId) {
      this.setMessage('User session not found. Please login again.', true);
      return;
    }

    this.loading = true;

    this.http.getProductsByManufacturer(this.userId).subscribe({
      next: (res: any) => {
        this.products = Array.isArray(res) ? res : [];
        this.filteredProducts = [...this.products];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load manufacturer products', err);
        this.products = [];
        this.filteredProducts = [];
        this.loading = false;
        this.setMessage('Unable to load products from backend.', true);
      }
    });
  }

  // =========================
  // CREATE / UPDATE PRODUCT
  // =========================

  onSubmit(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      this.setMessage('Please fill all required fields correctly.', true);
      return;
    }

    if (!this.userId) {
      this.setMessage('User session not found. Please login again.', true);
      return;
    }

    const payload = {
      manufacturerId: this.userId,
      name: this.itemForm.value.name,
      description: this.itemForm.value.description,
      price: Number(this.itemForm.value.price),
      stockQuantity: Number(this.itemForm.value.stockQuantity)
    };

    this.submitting = true;

    if (this.editingProductId) {
      this.http.updateProduct(payload, this.editingProductId).subscribe({
        next: () => {
          this.submitting = false;
          this.setMessage('Product updated successfully.', false);
          this.resetForm();
          this.loadProducts();
        },
        error: (err) => {
          console.error('Product update failed', err);
          this.submitting = false;
          this.setMessage('Failed to update product.', true);
        }
      });

      return;
    }

    this.http.createProduct(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.setMessage('Product created successfully.', false);
        this.resetForm();
        this.loadProducts();
      },
      error: (err) => {
        console.error('Product creation failed', err);
        this.submitting = false;
        this.setMessage('Failed to create product.', true);
      }
    });
  }

  editProduct(product: any): void {
    this.editingProductId = product.id;

    this.itemForm.patchValue({
      name: product.name || '',
      description: product.description || '',
      price: product.price || null,
      stockQuantity: product.stockQuantity ?? 0
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.setMessage(`Editing product #${product.id}. Update details and submit.`, false);
  }

  resetForm(): void {
    this.editingProductId = null;

    this.itemForm.reset({
      name: '',
      description: '',
      price: null,
      stockQuantity: null
    });
  }

  cancelEdit(): void {
    this.resetForm();
    this.setMessage('Edit cancelled.', false);
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
  // STATS
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

  // =========================
  // HELPERS
  // =========================

  isInvalid(controlName: string): boolean {
    const control = this.itemForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  setMessage(message: string, isError: boolean): void {
    this.formMessage = message;
    this.formMessageError = isError;
  }

  formatCurrency(value: any): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }
}