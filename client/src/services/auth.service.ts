import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() {}

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  setRole(role: string) {
    localStorage.setItem('role', role);
  }

  SetRole(role: string) {
    this.setRole(role);
  }

  saveUserId(id: number) {
    localStorage.setItem('userId', id.toString());
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  get getLoginStatus(): boolean {
    return localStorage.getItem('token') !== null;
  }

  get getRole(): string | null {
    return localStorage.getItem('role');
  }

  getUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? Number(id) : null;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
  }
}