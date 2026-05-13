import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpService } from '../../services/http.service';


@Component({
  selector: 'app-consumer-place-order',
  templateUrl: './consumer-place-order.component.html'
})
export class ConsumerPlaceOrderComponent implements OnInit {

  products: any[] = [];
  selectedProductId!: number;

  itemForm = this.fb.group({
    quantity: ['', Validators.required],
    status: ['PLACED', Validators.required]
  });

  constructor(private fb: FormBuilder,
              private http: HttpService) {}

  ngOnInit() {
    this.http.getProductsByConsumers().subscribe((data: any) => {
      this.products = data;
    });
  }

  selectProduct(id: number) {
    this.selectedProductId = id;
  }

  submit() {
    if (this.itemForm.invalid) return;

    const userId = Number(localStorage.getItem('userId'));

    this.http.consumerPlaceOrder(
      this.itemForm.value,
      this.selectedProductId,
      userId
    ).subscribe(() => {
      alert("Order placed successfully");
      this.itemForm.reset();
    });
  }
}