import { Component } from "@angular/core";
import { Validators, FormBuilder } from "@angular/forms";
import { HttpService } from "../../services/http.service";

@Component({ selector: 'app-place-order', template: '' })
export class PlaceOrderComponent {

  products:any[]=[];
selectedProductId:number=0;

ngOnInit(){
  this.http.getProductsByWholesaler()
  .subscribe((res:any)=> this.products=res);
}

selectProduct(id:number){
  this.selectedProductId=id;
}
itemForm = this.fb.group({
  quantity: [null as any, Validators.required],
  status: ['', Validators.required]
});


  constructor(private fb: FormBuilder, private http: HttpService) {}
submit() {
  if (this.itemForm.invalid) return;

  this.http.placeOrder(
    this.itemForm.value,
    this.selectedProductId,
    Number(localStorage.getItem('userId'))
  ).subscribe();
}

onSubmit() {
  this.submit();   // ✅ REQUIRED
}

}
