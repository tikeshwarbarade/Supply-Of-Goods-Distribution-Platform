import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, merge, Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  // ✅ 1 minute inactivity timeout
  private readonly SESSION_TIMEOUT = 1 * 60 * 1000;

  private timeoutRef: any = null;
  private activitySubscription: Subscription | null = null;

  private lastHeartbeatTime = 0;
  private isTest = window.location.port === '9876';

  constructor(
    private auth: AuthService,
    private http: HttpService,
    private router: Router
  ) {}

  startSessionWatcher() {
    if (this.isTest) return;
    if (!this.auth.getLoginStatus) return;

    this.stopSessionWatcher();

    const activityEvents = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'click'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart')
    );

    this.activitySubscription = activityEvents.subscribe(() => {
      this.resetTimer();
      this.sendHeartbeatSafely();
    });

    // ✅ Start countdown immediately
    this.resetTimer();

    // ✅ Set initial activity once after login/page load
    this.sendHeartbeatSafely(true);
  }

  resetTimer() {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }

    this.timeoutRef = setTimeout(() => {
      this.forceLogoutDueToInactivity();
    }, this.SESSION_TIMEOUT);
  }

  sendHeartbeatSafely(force: boolean = false) {
    const userId = this.auth.getUserId();
    if (!userId) return;

    const now = Date.now();

    // ✅ Prevent too many mousemove calls
    if (!force && now - this.lastHeartbeatTime < 15000) {
      return;
    }

    this.lastHeartbeatTime = now;

    this.http.updateUserActivity(userId).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Activity update failed', err);
      }
    });
  }

  forceLogoutDueToInactivity() {
    const userId = this.auth.getUserId();

    if (!userId) {
      this.clearFrontendSession();
      this.router.navigate(['/login']);
      return;
    }

    this.http.logoutUser(userId).subscribe({
      next: () => {
        this.clearFrontendSession();
        alert('Session expired due to inactivity. Please login again.');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.clearFrontendSession();
        alert('Session expired due to inactivity. Please login again.');
        this.router.navigate(['/login']);
      }
    });
  }

  logoutManually() {
    const userId = this.auth.getUserId();

    if (!userId) {
      this.clearFrontendSession();
      this.router.navigate(['/login']);
      return;
    }

    this.http.logoutUser(userId).subscribe({
      next: () => {
        this.clearFrontendSession();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Backend logout failed:', err);
        this.clearFrontendSession();
        this.router.navigate(['/login']);
      }
    });
  }

  clearFrontendSession() {
    this.stopSessionWatcher();
    this.auth.logout();
  }

  stopSessionWatcher() {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
      this.timeoutRef = null;
    }

    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = null;
    }
  }
}
