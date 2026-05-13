import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';


@Component({
  selector: 'app-consumer-get-orders',
  templateUrl: './consumer-get-orders.component.html'
})
export class ConsumerGetOrdersComponent implements OnInit {

  orders: any[] = [];
  feedback: string = "";

  constructor(private http: HttpService) {}

  ngOnInit() {
    const userId = Number(localStorage.getItem('userId'));

    this.http.getOrderConsumer(userId).subscribe((data: any) => {
      this.orders = data;
    });
  }

  addFeedback(orderId: number) {
    const userId = Number(localStorage.getItem('userId'));

    const data = {
      feedback: this.feedback
    };

    this.http.addConsumerFeedBack(orderId, userId, data)
      .subscribe(() => {
        alert("Feedback submitted");
        this.feedback = "";
      });
  }
}