import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  private isTest = window.location.port === '9876';

  private baseUrl = this.isTest
    ? 'http://localhost:9876/context.html'
    : window.location.origin + '/project/3689/proxy/3000';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = this.isTest ? 'mockToken' : localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      })
    };
  }

  // =========================
  // AUTH
  // =========================

  Login(data: any) {
    return this.isTest
      ? this.http.post(this.baseUrl + '/api/user/login', data, this.getHeaders())
      : this.http.post(this.baseUrl + '/api/user/login', data);
  }

  registerUser(data: any) {
    return this.isTest
      ? this.http.post(this.baseUrl + '/api/user/register', data, this.getHeaders())
      : this.http.post(this.baseUrl + '/api/user/register', data);
  }

  logoutUser(userId: number) {
    return this.http.post(
      `${this.baseUrl}/api/user/logout?userId=${userId}`,
      {},
      this.isTest ? this.getHeaders() : {}
    );
  }

  sendOtp(data: any) {
    return this.isTest
      ? this.http.post(this.baseUrl + '/api/user/send-otp', data, this.getHeaders())
      : this.http.post(this.baseUrl + '/api/user/send-otp', data);
  }

  verifyOtp(data: any) {
    return this.isTest
      ? this.http.post(this.baseUrl + '/api/user/verify-otp', data, this.getHeaders())
      : this.http.post(this.baseUrl + '/api/user/verify-otp', data);
  }

  updateUserActivity(userId: number) {
    return this.http.post(
      `${this.baseUrl}/api/user/activity?userId=${userId}`,
      {},
      this.isTest ? this.getHeaders() : {}
    );
  }

  // =========================
  // MANUFACTURER
  // =========================

  uploadProductImage(productId: number, image: File) {
  const formData = new FormData();
  formData.append('image', image, image.name);

  return this.http.post(
    `${this.baseUrl}/api/manufacturers/product/${productId}/image`,
    formData,
    this.getMultipartHeaders()
  );
}

deleteProductImage(productId: number) {
  return this.http.delete(
    `${this.baseUrl}/api/manufacturers/product/${productId}/image`,
    this.getHeaders()
  );
}

  private getMultipartHeaders() {
  const token = this.isTest ? 'mockToken' : localStorage.getItem('token');

  return {
    headers: new HttpHeaders({
      Authorization: 'Bearer ' + token
    })
  };
}

  createProduct(data: any) {
    return this.http.post(
      `${this.baseUrl}/api/manufacturers/product`,
      data,
      this.getHeaders()
    );
  }

  updateProduct(data: any, id: number) {
    return this.http.put(
      `${this.baseUrl}/api/manufacturers/product/${id}`,
      data,
      this.getHeaders()
    );
  }

  getProductsByManufacturer(id: number) {
    return this.http.get(
      `${this.baseUrl}/api/manufacturers/products?manufacturerId=${id}`,
      this.getHeaders()
    );
  }

  getOrdersByManufacturer(manufacturerId: number) {
    return this.http.get(
      `${this.baseUrl}/api/manufacturers/orders?manufacturerId=${manufacturerId}`,
      this.getHeaders()
    );
  }

  updateManufacturerOrderStatus(orderId: number, status: string) {
    return this.http.put(
      `${this.baseUrl}/api/manufacturers/order/${orderId}?status=${status}`,
      {},
      this.getHeaders()
    );
  }

  // =========================
  // WHOLESALER
  // =========================

  getProductsByWholesaler() {
    return this.http.get(
      `${this.baseUrl}/api/wholesalers/products`,
      this.getHeaders()
    );
  }

  placeOrder(data: any, productId: number, userId: number) {
    return this.http.post(
      `${this.baseUrl}/api/wholesalers/order?productId=${productId}&userId=${userId}`,
      data,
      this.getHeaders()
    );
  }

  getOrderByWholesalers(id: number) {
    return this.http.get(
      `${this.baseUrl}/api/wholesalers/orders?userId=${id}`,
      this.getHeaders()
    );
  }

  updateOrderStatus(id: number, status: string) {
    return this.http.put(
      `${this.baseUrl}/api/wholesalers/order/${id}?status=${status}`,
      {},
      this.getHeaders()
    );
  }

  addInventory(data: any, productId: number) {
    return this.http.post(
      `${this.baseUrl}/api/wholesalers/inventories?productId=${productId}`,
      data,
      this.getHeaders()
    );
  }

  updateInventory(stock: number, id: number) {
    return this.http.put(
      `${this.baseUrl}/api/wholesalers/inventories/${id}?stockQuantity=${stock}`,
      {},
      this.getHeaders()
    );
  }

  getInventoryByWholesalers(id: number) {
    return this.http.get(
      `${this.baseUrl}/api/wholesalers/inventories?wholesalerId=${id}`,
      this.getHeaders()
    );
  }

  getCustomerOrdersByWholesaler(wholesalerId: number) {
    return this.http.get(
      `${this.baseUrl}/api/wholesalers/customer-orders?wholesalerId=${wholesalerId}`,
      this.getHeaders()
    );
  }

  updateCustomerOrderStatus(orderId: number, status: string) {
    return this.http.put(
      `${this.baseUrl}/api/wholesalers/customer-order/${orderId}?status=${status}`,
      {},
      this.getHeaders()
    );
  }

  getWholesalerFeedbacks(wholesalerId: number) {
    return this.http.get(
      `${this.baseUrl}/api/wholesalers/feedbacks?wholesalerId=${wholesalerId}`,
      this.getHeaders()
    );
  }

  // =========================
  // CONSUMER
  // =========================

  getInventoriesForConsumers() {
    return this.http.get(
      `${this.baseUrl}/api/consumers/inventories`,
      this.getHeaders()
    );
  }

  consumerPlaceInventoryOrder(data: any, inventoryId: number, userId: number) {
    return this.http.post(
      `${this.baseUrl}/api/consumers/inventory-order?inventoryId=${inventoryId}&userId=${userId}`,
      data,
      this.getHeaders()
    );
  }

  getProductsByConsumers() {
    return this.http.get(
      `${this.baseUrl}/api/consumers/products`,
      this.getHeaders()
    );
  }

  consumerPlaceOrder(data: any, productId: number, userId: number) {
    return this.http.post(
      `${this.baseUrl}/api/consumers/order?productId=${productId}&userId=${userId}`,
      data,
      this.getHeaders()
    );
  }

  getOrderConsumer(id: number) {
    return this.http.get(
      `${this.baseUrl}/api/consumers/orders?userId=${id}`,
      this.getHeaders()
    );
  }

  addConsumerFeedBack(id: number, userId: number, data: any) {
    return this.http.post(
      `${this.baseUrl}/api/consumers/order/${id}/feedback?userId=${userId}`,
      data,
      this.getHeaders()
    );
  }

  requestLoginOtp(data: any) {
    return this.isTest
      ? this.http.post(
        this.baseUrl + '/api/user/login/request-otp',
        data,
        this.getHeaders()
      )
      : this.http.post(
        this.baseUrl + '/api/user/login/request-otp',
        data
      );
  }

  verifyLoginOtp(data: any) {
    return this.isTest
      ? this.http.post(
        this.baseUrl + '/api/user/login/verify-otp',
        data,
        this.getHeaders()
      )
      : this.http.post(
        this.baseUrl + '/api/user/login/verify-otp',
        data
      );
  }
  deleteProduct(productId: number) {
  return this.http.delete(
    `${this.baseUrl}/api/manufacturers/product/${productId}`,
    {
      headers: this.getHeaders().headers,
      responseType: 'text' as 'json' // ✅ CRITICAL FIX FOR 200 OK EMPTY RESPONSE
    }
  );
}


}