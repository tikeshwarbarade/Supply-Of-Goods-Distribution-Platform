import {
  Component,
  ViewChildren,
  QueryList,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnDestroy {

  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;

  currentStep: 'email' | 'otp' | 'reset' | 'success' = 'email';

  email = '';
  emailLoading = false;

  otpDigits: string[] = ['', '', '', '', '', ''];
  otpLoading = false;
  maxOtpAttempts = 3;
  otpAttempts = 0;
  otpLocked = false;

  otpTimer = 60;
  private otpInterval: any = null;

  otpExpirySeconds = 300;
  otpExpiryDisplay = '5:00';
  private expiryInterval: any = null;

  newPassword = '';
  confirmNewPassword = '';
  showNewPassword = false;
  showConfirmNewPassword = false;
  resetLoading = false;

  message = '';
  messageType: 'success' | 'error' | 'warning' | '' = '';

  constructor(
    private http: HttpService,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    this.clearAllTimers();
  }

  trackByIndex(index: number): number {
    return index;
  }

  // =========================
  // HELPERS
  // =========================

  private normalizeEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
  }

  private isValidEmail(email: string): boolean {
    return /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(email);
  }

  private setMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    this.message = message;
    this.messageType = type;
  }

  private clearMessage(): void {
    this.message = '';
    this.messageType = '';
  }

  // =========================
  // STEP 1: SEND OTP
  // =========================

  sendOtp(): void {
    this.clearMessage();

    const normalizedEmail = this.normalizeEmail(this.email);

    if (!normalizedEmail || !this.isValidEmail(normalizedEmail)) {
      this.setMessage('Please enter a valid email address.', 'error');
      return;
    }

    this.email = normalizedEmail;
    this.emailLoading = true;

    this.http.forgotPasswordSendOtp({ email: normalizedEmail }).subscribe({
      next: (res: any) => {
        this.emailLoading = false;

        this.currentStep = 'otp';
        this.otpAttempts = 0;
        this.otpLocked = false;

        this.resetOtpInputs();
        this.setMessage(res?.message || 'OTP sent! Check your email.', 'success');

        this.startResendTimer();
        this.startExpiryTimer();

        setTimeout(() => this.focusOtp(0), 200);
      },
      error: (err) => {
        this.emailLoading = false;

        this.setMessage(
          err?.error?.message || 'Failed to send OTP. Please check your email and try again.',
          'error'
        );
      }
    });
  }

  // =========================
  // STEP 2: VERIFY OTP
  // =========================

  verifyOtp(): void {
    this.clearMessage();

    const normalizedEmail = this.normalizeEmail(this.email);
    const otp = this.otpDigits.join('');

    if (!normalizedEmail || !this.isValidEmail(normalizedEmail)) {
      this.setMessage('Please enter a valid email address.', 'error');
      return;
    }

    if (otp.length !== 6) {
      this.setMessage('Please enter the complete 6-digit OTP.', 'warning');
      return;
    }

    if (this.otpExpirySeconds <= 0) {
      this.setMessage('OTP expired. Please resend a new code.', 'error');
      return;
    }

    if (this.otpLocked) {
      this.setMessage('Too many failed attempts. Please request a new OTP.', 'error');
      return;
    }

    this.otpLoading = true;

    this.http.forgotPasswordVerifyOtp({
      email: normalizedEmail,
      otp
    }).subscribe({
      next: (res: any) => {
        this.otpLoading = false;

        this.clearAllTimers();
        this.currentStep = 'reset';

        this.setMessage(res?.message || 'OTP verified! Set your new password.', 'success');
      },
      error: (err) => {
        this.otpLoading = false;
        this.otpAttempts++;

        if (this.otpAttempts >= this.maxOtpAttempts) {
          this.otpLocked = true;
          this.resetOtpInputs();

          this.setMessage(
            err?.error?.message || 'Too many failed attempts. Please request a new OTP.',
            'error'
          );

          return;
        }

        this.setMessage(
          err?.error?.message || 'Invalid OTP. Please try again.',
          'error'
        );

        this.resetOtpInputs();

        setTimeout(() => this.focusOtp(0), 100);
      }
    });
  }

  // =========================
  // STEP 3: RESET PASSWORD
  // =========================

  resetPassword(): void {
    this.clearMessage();

    const normalizedEmail = this.normalizeEmail(this.email);

    if (!normalizedEmail || !this.isValidEmail(normalizedEmail)) {
      this.setMessage('Please enter a valid email address.', 'error');
      this.currentStep = 'email';
      return;
    }

    if (!this.newPassword) {
      this.setMessage('Please enter a new password.', 'error');
      return;
    }

    if (this.newPassword.length < 8) {
      this.setMessage('Password must be at least 8 characters.', 'error');
      return;
    }

    if (!this.confirmNewPassword) {
      this.setMessage('Please confirm your new password.', 'error');
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.setMessage('Passwords do not match.', 'error');
      return;
    }

    this.resetLoading = true;

    this.http.resetPassword({
      email: normalizedEmail,
      newPassword: this.newPassword
    }).subscribe({
      next: (res: any) => {
        this.resetLoading = false;
        this.currentStep = 'success';

        this.newPassword = '';
        this.confirmNewPassword = '';

        this.setMessage(res?.message || 'Password reset successful!', 'success');
      },
      error: (err) => {
        this.resetLoading = false;

        this.setMessage(
          err?.error?.message || 'Failed to reset password. Please try again.',
          'error'
        );
      }
    });
  }

  // =========================
  // RESEND OTP
  // =========================

  resendOtp(): void {
    if (this.otpTimer > 0 && !this.otpLocked) {
      return;
    }

    this.clearMessage();

    const normalizedEmail = this.normalizeEmail(this.email);

    if (!normalizedEmail || !this.isValidEmail(normalizedEmail)) {
      this.setMessage('Please enter a valid email address.', 'error');
      this.currentStep = 'email';
      return;
    }

    this.emailLoading = true;
    this.otpAttempts = 0;
    this.otpLocked = false;

    this.resetOtpInputs();

    this.http.forgotPasswordSendOtp({ email: normalizedEmail }).subscribe({
      next: (res: any) => {
        this.emailLoading = false;

        this.setMessage(res?.message || 'New OTP sent!', 'success');

        this.startResendTimer();
        this.startExpiryTimer();

        setTimeout(() => this.focusOtp(0), 200);
      },
      error: (err) => {
        this.emailLoading = false;

        this.setMessage(
          err?.error?.message || 'Failed to resend OTP.',
          'error'
        );
      }
    });
  }

  // =========================
  // OTP INPUT HELPERS
  // =========================

  private focusOtp(index: number): void {
    queueMicrotask(() => {
      const boxes = this.otpBoxes?.toArray();

      if (boxes && boxes[index]) {
        boxes[index].nativeElement.focus();
      }
    });
  }

  private resetOtpInputs(): void {
    this.otpDigits = ['', '', '', '', '', ''];

    queueMicrotask(() => {
      const boxes = this.otpBoxes?.toArray();

      if (boxes?.length) {
        boxes.forEach(box => {
          box.nativeElement.value = '';
        });
      }
    });
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const raw = (input.value || '').replace(/\D/g, '');
    const digit = raw ? raw[raw.length - 1] : '';

    this.otpDigits[index] = digit;
    input.value = digit;

    if (digit && index < 5) {
      this.focusOtp(index + 1);
    }

    this.clearMessage();
  }

  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    const key = event.key;

    if (key === 'Backspace') {
      if (this.otpDigits[index]) {
        this.otpDigits[index] = '';
        (event.target as HTMLInputElement).value = '';
        return;
      }

      if (index > 0) {
        this.otpDigits[index - 1] = '';
        this.focusOtp(index - 1);

        queueMicrotask(() => {
          const boxes = this.otpBoxes?.toArray();

          if (boxes?.[index - 1]) {
            boxes[index - 1].nativeElement.value = '';
          }
        });
      }

      return;
    }

    if (key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusOtp(index - 1);
      return;
    }

    if (key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusOtp(index + 1);
      return;
    }

    if (key.length === 1 && !/^[0-9]$/.test(key)) {
      event.preventDefault();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    const text = (event.clipboardData?.getData('text') || '')
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!text) {
      return;
    }

    event.preventDefault();

    this.otpDigits = ['', '', '', '', '', ''];

    for (let i = 0; i < text.length; i++) {
      this.otpDigits[i] = text[i];
    }

    queueMicrotask(() => {
      const boxes = this.otpBoxes?.toArray();

      if (boxes?.length) {
        for (let i = 0; i < 6; i++) {
          boxes[i].nativeElement.value = this.otpDigits[i] || '';
        }
      }

      this.focusOtp(Math.min(text.length, 5));
    });

    this.clearMessage();
  }

  // =========================
  // TIMERS
  // =========================

  private startResendTimer(): void {
    this.otpTimer = 60;

    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }

    this.otpInterval = setInterval(() => {
      this.otpTimer--;

      if (this.otpTimer <= 0) {
        clearInterval(this.otpInterval);
        this.otpInterval = null;
      }
    }, 1000);
  }

  private startExpiryTimer(): void {
    this.otpExpirySeconds = 300;
    this.updateExpiryDisplay();

    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
    }

    this.expiryInterval = setInterval(() => {
      this.otpExpirySeconds--;
      this.updateExpiryDisplay();

      if (this.otpExpirySeconds <= 0) {
        clearInterval(this.expiryInterval);
        this.expiryInterval = null;
      }
    }, 1000);
  }

  private updateExpiryDisplay(): void {
    const minutes = Math.floor(this.otpExpirySeconds / 60);
    const seconds = this.otpExpirySeconds % 60;

    this.otpExpiryDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private clearAllTimers(): void {
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
      this.otpInterval = null;
    }

    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
      this.expiryInterval = null;
    }
  }

  // =========================
  // NAVIGATION
  // =========================

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goBackToEmail(): void {
    this.currentStep = 'email';
    this.clearMessage();

    this.otpAttempts = 0;
    this.otpLocked = false;

    this.clearAllTimers();
    this.resetOtpInputs();
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmNewPassword(): void {
    this.showConfirmNewPassword = !this.showConfirmNewPassword;
  }
}