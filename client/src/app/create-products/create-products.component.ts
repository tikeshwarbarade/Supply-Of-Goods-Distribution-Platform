
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  deletingProductId: number | null = null;

  productSearch = '';

  loading = false;
  submitting = false;

  formMessage = '';
  formMessageError = false;

  confirmVisible = false;
confirmTitle = '';
confirmMessage = '';
confirmCallback: (() => void) | null = null;


  // Image upload
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  removeExistingImage = false;

  // Used when coming from manufacturer dashboard edit button
  pendingEditProductId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private http: HttpService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userId = this.auth.getUserId();

    this.itemForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(1)]],
      stockQuantity: [null, [Validators.required, Validators.min(0)]]
    });

    this.route.queryParams.subscribe(params => {
      const editId = params['editProductId'];
      this.pendingEditProductId = editId ? Number(editId) : null;
    });

    this.loadProducts();
  }

  loadProducts(): void {
  if (!this.userId) {
    this.setMessage('User session not found.', true);
    return;
  }

  this.loading = true;

  this.http.getProductsByManufacturer(this.userId).subscribe({
    next: (res: any) => {

      this.products = Array.isArray(res) ? res : [];

      // ✅ ALWAYS sync filtered list correctly
      this.applyProductSearch();

      this.loading = false;

      // ✅ EDIT MODE HANDLING
      if (this.pendingEditProductId !== null) {
        const product = this.products.find(
          item => Number(item.id) === Number(this.pendingEditProductId)
        );

        if (product) {
          this.editProduct(product);
        }

        this.pendingEditProductId = null;
      }
    },

    error: () => {
      this.products = [];
      this.filteredProducts = [];
      this.loading = false;
      this.setMessage('Unable to load products.', true);
    }
  });
}


  onSubmit(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      this.setMessage('Please fill all required fields correctly.', true);
      return;
    }

    if (!this.userId) {
      this.setMessage('Session not found.', true);
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
    next: (updatedProduct: any) => {
      const productId = Number(updatedProduct?.id || this.editingProductId);

      // ✅ CASE 1: New image uploaded
      if (this.selectedImage) {
        this.http.uploadProductImage(productId, this.selectedImage).subscribe({
          next: () => {
            this.submitting = false;
            this.setMessage('Product + image updated successfully.', false);
            this.resetForm();
            this.loadProducts();
          },
          error: () => {
            this.submitting = false;
            this.setMessage('Product updated but image upload failed.', true);
            this.resetForm();
            this.loadProducts();
          }
        });
        return;
      }

      // ✅ CASE 2: Remove existing image
      if (this.removeExistingImage) {
        this.http.deleteProductImage(productId).subscribe({
          next: () => {
            this.submitting = false;
            this.setMessage('Product updated and image removed.', false);
            this.resetForm();
            this.loadProducts();
          },
          error: () => {
            this.submitting = false;
            this.setMessage('Product updated but image removal failed.', true);
            this.resetForm();
            this.loadProducts();
          }
        });
        return;
      }

      // ✅ CASE 3: Only product updated
      this.submitting = false;
      this.setMessage('Product updated successfully.', false);
      this.resetForm();
      this.loadProducts();
    },
    error: () => {
      this.submitting = false;
      this.setMessage('Failed to update product.', true);
    }
  });

  return;
}


    this.http.createProduct(payload).subscribe({
      next: (createdProduct: any) => {
        const productId = Number(createdProduct?.id);

        if (!productId) {
          this.submitting = false;
          this.setMessage('Product created but image upload failed because product id was missing.', true);
          this.loadProducts();
          return;
        }

        this.afterProductSaved(
          productId,
          'Product created successfully.'
        );
      },
      error: () => {
        this.submitting = false;
        this.setMessage('Failed to create product.', true);
      }
    });
  }

  afterProductSaved(productId: number, successMessage: string): void {
    if (this.selectedImage) {
      this.http.uploadProductImage(productId, this.selectedImage).subscribe({
        next: () => {
          this.submitting = false;
          this.setMessage(`${successMessage} Image uploaded successfully.`, false);
          this.resetForm();
          this.loadProducts();
        },
        error: () => {
          this.submitting = false;
          this.setMessage(`${successMessage} But image upload failed.`, true);
          this.resetForm();
          this.loadProducts();
        }
      });

      return;
    }

    if (this.editingProductId && this.removeExistingImage) {
      this.http.deleteProductImage(productId).subscribe({
        next: () => {
          this.submitting = false;
          this.setMessage(`${successMessage} Image removed successfully.`, false);
          this.resetForm();
          this.loadProducts();
        },
        error: () => {
          this.submitting = false;
          this.setMessage(`${successMessage} But image removal failed.`, true);
          this.resetForm();
          this.loadProducts();
        }
      });

      return;
    }

    this.submitting = false;
    this.setMessage(successMessage, false);
    this.resetForm();
    this.loadProducts();
  }
  deleteProduct(product: any): void {

  if (!product?.id) {
    this.setMessage('Product id not found.', true);
    return;
  }

  this.confirmTitle = 'Delete Product';
  this.confirmMessage = `Delete product #${product.id}? This cannot be undone.`;

  this.confirmCallback = () => {

    if (this.deletingProductId) return; // ✅ prevent double click

    this.deletingProductId = product.id;

    this.http.deleteProduct(product.id).subscribe({

      next: () => {
        console.log('DELETE SUCCESS ✅');

        // ✅ reload from backend (source of truth)
        this.loadProducts();

        this.deletingProductId = null;
        this.setMessage('Product deleted successfully.', false);
      },

      error: () => {
        console.log('DELETE ERROR ❌');

        this.deletingProductId = null;
        this.setMessage('Failed to delete product.', true);
      }

    });
  };

  this.confirmVisible = true;
}


  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.setMessage('Please select a valid image file.', true);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.setMessage('Image must be under 5MB.', true);
        return;
      }

      this.selectedImage = file;
      this.removeExistingImage = false;

      const reader = new FileReader();

      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };

      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;

    const input = document.getElementById('productImageInput') as HTMLInputElement;

    if (input) {
      input.value = '';
    }

    if (this.editingProductId) {
      this.removeExistingImage = true;
    }
  }

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

  triggerFileInput(): void {
    const el = document.getElementById('productImageInput') as HTMLInputElement;

    if (el) {
      el.click();
    }
  }

  editProduct(product: any): void {
    this.editingProductId = product.id;

    this.itemForm.patchValue({
      name: product.name || '',
      description: product.description || '',
      price: product.price || null,
      stockQuantity: product.stockQuantity ?? 0
    });

    this.imagePreview = product.imageUrl
      ? this.getImageUrl(product.imageUrl)
      : null;

    this.selectedImage = null;
    this.removeExistingImage = false;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.setMessage(`Editing product #${product.id}. Update and submit.`, false);
  }

  resetForm(): void {
    this.editingProductId = null;

    this.itemForm.reset({
      name: '',
      description: '',
      price: null,
      stockQuantity: null
    });

    this.selectedImage = null;
    this.imagePreview = null;
    this.removeExistingImage = false;

    const input = document.getElementById('productImageInput') as HTMLInputElement;

    if (input) {
      input.value = '';
    }
  }

  cancelEdit(): void {
    this.resetForm();
    this.setMessage('Edit cancelled.', false);
  }

  goBack(): void {
    this.router.navigate(['/manufacturer-dashboard']);
  }

  onProductSearch(value: string): void {
    this.productSearch = value;
    this.applyProductSearch();
  }

  clearSearch(): void {
    this.productSearch = '';
    this.applyProductSearch();
  }

  applyProductSearch(): void {
    const q = this.productSearch.trim().toLowerCase();

    if (!q) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products.filter(p =>
      [p.id, p.name, p.description, p.price, p.stockQuantity]
        .map(v => String(v ?? '').toLowerCase())
        .join(' ')
        .includes(q)
    );
  }

  get productCount(): number {
    return this.products.length;
  }

  get totalStock(): number {
    return this.products.reduce(
      (s, p) => s + Number(p.stockQuantity || 0),
      0
    );
  }

  get inventoryValue(): number {
    return this.products.reduce(
      (s, p) => s + Number(p.price || 0) * Number(p.stockQuantity || 0),
      0
    );
  }

  isInvalid(controlName: string): boolean {
    const c = this.itemForm.get(controlName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  setMessage(msg: string, isError: boolean): void {
    this.formMessage = msg;
    this.formMessageError = isError;
  }

  formatCurrency(v: any): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(v || 0));
  }

  getStockStatusLabel(qty: number): string {
    return qty === 0
      ? 'Out of Stock'
      : qty < 10
        ? 'Low Stock'
        : 'In Stock';
  }

  getStockPercent(p: any): number {
    const s = Number(p?.stockQuantity ?? 0);

    const avg =
      this.totalStock > 0 && this.productCount > 0
        ? this.totalStock / this.productCount
        : 100;

    return Math.min(Math.round((s / Math.max(avg, 1)) * 100), 100);
  }
onConfirmYes(): void {

  console.log('CONFIRM CLICKED ✅'); // ✅ ADD THIS

  this.confirmVisible = false;

  if (this.confirmCallback) {
    this.confirmCallback();
    this.confirmCallback = null;
  }
}


onConfirmCancel(): void {
  this.confirmVisible = false;
  this.confirmCallback = null;
}

  getStockIcon(qty: number): string {
    return qty === 0 ? 'error' : qty < 10 ? 'warning' : 'check_circle';
  }
}

