import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  private readonly isTest: boolean = window.location.port === '9876';

  private readonly baseUrl: string = this.isTest
    ? 'http://localhost:9876/context.html'
    : window.location.origin + '/project/3689/proxy/3000';

  constructor(private http: HttpClient) {}

  // =====================================================
  // HEADERS
  // =====================================================

  private getHeaders() {
    const token = this.isTest ? 'mockToken' : localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      })
    };
  }

  private getMultipartHeaders() {
    const token = this.isTest ? 'mockToken' : localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + token
      })
    };
  }

  private getPublicOptions() {
    return this.isTest ? this.getHeaders() : {};
  }

  // =====================================================
  // AUTH
  // =====================================================

  Login(data: any) {
    return this.http.post(
      `${this.baseUrl}/api/user/login`,
      data,
      this.getPublicOptions()
    );
  }

  registerUser(data: any) {
    return this.http.post(
      `${this.baseUrl}/api/user/register`,
      data,
      this.getPublicOptions()
    );
  }

  logoutUser(userId: number) {
    return this.http.post(
      `${this.baseUrl}/api/user/logout?userId=${userId}`,
      {},
      this.getPublicOptions()
    );
  }

  updateUserActivity(userId: number) {
    return this.http.post(
      `${this.baseUrl}/api/user/activity?userId=${userId}`,
      {},
      this.getPublicOptions()
    );
  }

  // =====================================================
  // REGISTRATION OTP
  // =====================================================

  sendOtp(data: any) {
    return this.http.post(
      `${this.baseUrl}/api/user/send-otp`,
      data,
      this.getPublicOptions()
    );
  }

  verifyOtp(data: any) {
    return this.http.post(
      `${this.baseUrl}/api/user/verify-otp`,
      data,
      this.getPublicOptions()
    );
  }

  suggestUsername(username: string) {
    return this.http.get(
      `${this.baseUrl}/api/user/suggest-username?username=${encodeURIComponent(username)}`,
      this.getPublicOptions()
    );
  }

  // =====================================================
  // LOGIN OTP
  // =====================================================

  requestLoginOtp(data: any) {
    return this.http.post(
      `${this.baseUrl}/api/user/login/request-otp`,
      data,
      this.getPublicOptions()
    );
  }

  verifyLoginOtp(data: any) {
    return this.http.post(
      `${this.baseUrl}/api/user/login/verify-otp`,
      data,
      this.getPublicOptions()
    );
  }

  // =====================================================
  // FORGOT PASSWORD
  // =====================================================

  forgotPasswordSendOtp(data: any) {
    return this.http.post(
      `${this.baseUrl}/api/user/forgot-password/send-otp`,
      data,
      this.getPublicOptions()
    );
  }

  forgotPasswordVerifyOtp(data: any) {
    return this.http.post(
      `${this.baseUrl}/api/user/forgot-password/verify-otp`,
      data,
      this.getPublicOptions()
    );
  }

  resetPassword(data: any) {
    return this.http.post(
      `${this.baseUrl}/api/user/reset-password`,
      data,
      this.getPublicOptions()
    );
  }

  // =====================================================
  // MANUFACTURER
  // =====================================================

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

  deleteProduct(productId: number) {
    return this.http.delete(
      `${this.baseUrl}/api/manufacturers/product/${productId}`,
      {
        headers: this.getHeaders().headers,
        responseType: 'text' as 'json'
      }
    );
  }

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

  getProductsByManufacturer(manufacturerId: number) {
    return this.http.get(
      `${this.baseUrl}/api/manufacturers/products?manufacturerId=${manufacturerId}`,
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

  // =====================================================
  // WHOLESALER
  // =====================================================

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

  getOrderByWholesalers(userId: number) {
    return this.http.get(
      `${this.baseUrl}/api/wholesalers/orders?userId=${userId}`,
      this.getHeaders()
    );
  }

  updateOrderStatus(orderId: number, status: string) {
    return this.http.put(
      `${this.baseUrl}/api/wholesalers/order/${orderId}?status=${status}`,
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

  updateInventory(stockQuantity: number, inventoryId: number) {
    return this.http.put(
      `${this.baseUrl}/api/wholesalers/inventories/${inventoryId}?stockQuantity=${stockQuantity}`,
      {},
      this.getHeaders()
    );
  }

  getInventoryByWholesalers(wholesalerId: number) {
    return this.http.get(
      `${this.baseUrl}/api/wholesalers/inventories?wholesalerId=${wholesalerId}`,
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

  // =====================================================
  // CONSUMER
  // =====================================================

  getProductsByConsumers() {
    return this.http.get(
      `${this.baseUrl}/api/consumers/products`,
      this.getHeaders()
    );
  }

  getInventoriesForConsumers() {
    return this.http.get(
      `${this.baseUrl}/api/consumers/inventories`,
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

  consumerPlaceInventoryOrder(data: any, inventoryId: number, userId: number) {
    return this.http.post(
      `${this.baseUrl}/api/consumers/inventory-order?inventoryId=${inventoryId}&userId=${userId}`,
      data,
      this.getHeaders()
    );
  }

  getOrderConsumer(userId: number) {
    return this.http.get(
      `${this.baseUrl}/api/consumers/orders?userId=${userId}`,
      this.getHeaders()
    );
  }

  addConsumerFeedBack(orderId: number, userId: number, data: any) {
    return this.http.post(
      `${this.baseUrl}/api/consumers/order/${orderId}/feedback?userId=${userId}`,
      data,
      this.getHeaders()
    );
  }
}
