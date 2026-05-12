import { TestBed, inject } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { HttpService } from '../services/http.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../environments/environment.development';

describe('HttpService', () => {
  let service: HttpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpService,
        AuthService,
        { provide: AuthService, useValue: { getToken: () => 'mockToken' } }
      ]
    });
    service = TestBed.inject(HttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Other existing test cases...

  it('should get products by wholesaler', () => {
    const mockResponse = [{ id: 1, name: 'Product 1' }, { id: 2, name: 'Product 2' }];

    service.getProductsByWholesaler().subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/wholesalers/products`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    req.flush(mockResponse);
  });

  it('should get products by consumers', () => {
    const mockResponse = [{ id: 1, name: 'Product 1' }, { id: 2, name: 'Product 2' }];

    service.getProductsByConsumers().subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/consumers/products`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    req.flush(mockResponse);
  });

  it('should get orders by wholesalers', () => {
    const userId = 123;
    const mockResponse = [{ id: 1, content: 'Order 1' }, { id: 2, content: 'Order 2' }];

    service.getOrderByWholesalers(userId).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/wholesalers/orders?userId=${userId}`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    req.flush(mockResponse);
  });

  it('should get orders by consumers', () => {
    const userId = 456;
    const mockResponse = [{ id: 1, content: 'Order 1' }, { id: 2, content: 'Order 2' }];

    service.getOrderConsumer(userId).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/consumers/orders?userId=${userId}`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    req.flush(mockResponse);
  });

  it('should get inventory by wholesalers', () => {
    const wholesalerId = 789;
    const mockResponse = [{ id: 1, product: 'Product 1', quantity: 10 }, { id: 2, product: 'Product 2', quantity: 20 }];

    service.getInventoryByWholesalers(wholesalerId).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/wholesalers/inventories?wholesalerId=${wholesalerId}`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    req.flush(mockResponse);
  });

  it('should get products by manufacturer', () => {
    const manufacturerId = 987;
    const mockResponse = [{ id: 1, name: 'Product 1' }, { id: 2, name: 'Product 2' }];

    service.getProductsByManufacturer(manufacturerId).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/manufacturers/products?manufacturerId=${manufacturerId}`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    req.flush(mockResponse);
  });

  it('should place order', () => {
    const orderDetails = { name: 'New Order', items: ['Product 1', 'Product 2'] };
    const productId = 123;
    const userId = 456;
    const mockResponse = { id: 1, success: true };

    service.placeOrder(orderDetails, productId, userId).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/wholesalers/order?productId=${productId}&userId=${userId}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    expect(req.request.body).toEqual(orderDetails);
    req.flush(mockResponse);
  });

  it('should place order for consumer', () => {
    const orderDetails = { name: 'New Order', items: ['Product 1', 'Product 2'] };
    const productId = 123;
    const userId = 456;
    const mockResponse = { id: 1, success: true };

    service.consumerPlaceOrder(orderDetails, productId, userId).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/consumers/order?productId=${productId}&userId=${userId}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    expect(req.request.body).toEqual(orderDetails);
    req.flush(mockResponse);
  });

  it('should update order status', () => {
    const orderId = 789;
    const status = 'completed';
    const mockResponse = { id: 1, success: true };

    service.updateOrderStatus(orderId, status).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/wholesalers/order/${orderId}?status=${status}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    req.flush(mockResponse);
  });

  it('should add consumer feedback', () => {
    const orderId = 159;
    const userId = 357;
    const feedbackDetails = { rating: 4, comment: 'Great product!' };
    const mockResponse = { id: 1, success: true };

    service.addConsumerFeedBack(orderId, userId, feedbackDetails).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/consumers/order/${orderId}/feedback?userId=${userId}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    expect(req.request.body).toEqual(feedbackDetails);
    req.flush(mockResponse);
  });

  it('should create a product', () => {
    const productDetails = { name: 'New Product', description: 'This is a new product' };
    const mockResponse = { id: 1, success: true };

    service.createProduct(productDetails).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/manufacturers/product`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    expect(req.request.body).toEqual(productDetails);
    req.flush(mockResponse);
  });

  it('should update a product', () => {
    const productDetails = { name: 'Updated Product', description: 'This is an updated product' };
    const productId = 987;
    const mockResponse = { id: 1, success: true };

    service.updateProduct(productDetails, productId).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/manufacturers/product/${productId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    expect(req.request.body).toEqual(productDetails);
    req.flush(mockResponse);
  });

  it('should add inventory', () => {
    const inventoryDetails = { product: 'New Product', quantity: 50 };
    const productId = 753;
    const mockResponse = { id: 1, success: true };

    service.addInventory(inventoryDetails, productId).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/wholesalers/inventories?productId=${productId}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    expect(req.request.body).toEqual(inventoryDetails);
    req.flush(mockResponse);
  });

  it('should update inventory', () => {
    const stockQuantity = 75;
    const inventoryId = 951;
    const mockResponse = { id: 1, success: true };

    service.updateInventory(stockQuantity, inventoryId).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/wholesalers/inventories/${inventoryId}?stockQuantity=${stockQuantity}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    req.flush(mockResponse);
  });

  it('should login', () => {
    const loginDetails = { username: 'testuser', password: 'testpassword' };
    const mockResponse = { token: 'mockToken', userId: 123 };

    service.Login(loginDetails).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/user/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.body).toEqual(loginDetails);
    req.flush(mockResponse);
  });

  it('should register user', () => {
    const registerDetails = { name: 'John Doe', email: 'john.doe@example.com', password: 'testpassword' };
    const mockResponse = { userId: 456, success: true };

    service.registerUser(registerDetails).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/user/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.body).toEqual(registerDetails);
    req.flush(mockResponse);
  });
});