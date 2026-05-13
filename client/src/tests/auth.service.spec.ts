import { TestBed } from '@angular/core/testing';
import { AuthService } from '../services/auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AuthService] });
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saveToken() should store token in localStorage', () => {
    service.saveToken('myTestToken');
    expect(localStorage.getItem('token')).toBe('myTestToken');
  });

  it('getToken() should return stored token', () => {
    localStorage.setItem('token', 'storedToken');
    expect(service.getToken()).toBe('storedToken');
  });

  it('getToken() should return null when no token stored', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getLoginStatus should return true when token exists', () => {
    service.saveToken('someToken');
    expect(service.getLoginStatus).toBeTrue();
  });

  it('getLoginStatus should return false when no token', () => {
    expect(service.getLoginStatus).toBeFalse();
  });

  it('SetRole() should store role in localStorage', () => {
    service.SetRole('MANUFACTURER');
    expect(localStorage.getItem('role')).toBe('MANUFACTURER');
  });

  it('getRole should return stored role', () => {
    localStorage.setItem('role', 'WHOLESALER');
    expect(service.getRole).toBe('WHOLESALER');
  });

  it('logout() should clear token and role from localStorage', () => {
    service.saveToken('tokenToRemove');
    service.SetRole('CONSUMER');
    service.logout();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
    expect(service.getLoginStatus).toBeFalse();
  });
});
