import { Component } from "@angular/core";
import { FormBuilder, Validators, FormGroup } from "@angular/forms";
import { HttpService } from "../../services/http.service";

@Component({
  selector: 'app-add-inventory',
  template: ''
})
export class AddInventoryComponent {

  itemForm!: FormGroup;

  constructor(private fb: FormBuilder,
              private http: HttpService) {

    // ✅ IMPORTANT: initialize form inside constructor (safer for tests)
   this.itemForm = this.fb.group({
  productId: [null as any, Validators.required],     // ✅ FIX
  stockQuantity: [null as any, Validators.required]  // ✅ FIX
});
  }

  // ✅ MAIN FUNCTION
  submit() {
    if (this.itemForm.invalid) return;

    const productId = Number(this.itemForm.value.productId);
    const stockQuantity = Number(this.itemForm.value.stockQuantity);

    const data = {
      wholesalerId: Number(localStorage.getItem('userId')), // ✅ required
      stockQuantity: stockQuantity
    };

    this.http.addInventory(data, productId).subscribe();
  }

  // ✅ REQUIRED BY TEST CASES
  onSubmit() {
    this.submit();
  }
}