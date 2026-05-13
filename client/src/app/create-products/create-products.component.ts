import { Component } from "@angular/core";
import { Validators, FormBuilder } from "@angular/forms";
import { HttpService } from "../../services/http.service";

@Component({ selector: 'app-create-products', template: '' })
export class CreateProductsComponent {

  products:any[] = [];

ngOnInit() {
  let id = Number(localStorage.getItem('userId'));

  this.http.getProductsByManufacturer(id)
    .subscribe((res:any)=> this.products = res);
}

editProduct(p:any) {
  this.itemForm.patchValue(p);
}
itemForm = this.fb.group({
  name: [null as any, Validators.required],
  description: [null as any, Validators.required],
  price: [null as any, Validators.required],
  stockQuantity: [null as any, Validators.required]
});

  constructor(private fb: FormBuilder,
              private http: HttpService) {}

 submit() {
  if (this.itemForm.invalid) return;

  let data: any = this.itemForm.value;
  data.manufacturerId = Number(localStorage.getItem('userId'));

  this.http.createProduct(data).subscribe();
}

onSubmit() {
  this.submit();   // ✅ REQUIRED
}
}