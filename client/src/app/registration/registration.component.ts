import {
  Component,
  ViewChildren,
  QueryList,
  ElementRef
} from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent {

  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;

  itemForm = this.fb.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(4),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]
    ],
    firstName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-Z ]+$/)
      ]
    ],
    lastName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-Z ]+$/)
      ]
    ],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: [null as any, Validators.required]
  });

  companyName = '';
  phone = '';
  confirmPassword = '';

  showPassword = false;
  showConfirmPassword = false;

  formMessage = '';
  formMessageError = false;

  otpDigits: string[] = ['', '', '', '', '', ''];
  otpVerified = false;
  verifiedEmail = '';
  otpSent = false;

  otpLoading = false;
  verifyLoading = false;
  registrationLoading = false;

  otpAttempts = 0;
  maxOtpAttempts = 3;

  otpMessage = '';
  otpMessageType: 'success' | 'error' | 'warning' | '' = '';

  usernameSuggestions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpService,
    private router: Router
  ) {
    this.itemForm.get('email')?.valueChanges.subscribe(() => {
      this.otpVerified = false;
      this.verifiedEmail = '';
      this.otpSent = false;
      this.otpAttempts = 0;
      this.resetOtpInputs(true);
    });

    this.itemForm.get('username')?.valueChanges.subscribe(() => {
      this.usernameSuggestions = [];
    });
  }

  // =========================
  // UI HELPERS
  // =========================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private normalizeEmail(email: any): string {
    return String(email || '').trim().toLowerCase();
  }

  shouldShowVerifyButton(): boolean {
    const emailControl = this.itemForm.get('email');
    return !!emailControl?.value && !emailControl.invalid && !this.otpVerified;
  }

  canSendOtp(): boolean {
    return (
      !this.itemForm.get('username')?.invalid &&
      !this.itemForm.get('firstName')?.invalid &&
      !this.itemForm.get('lastName')?.invalid &&
      !this.itemForm.get('email')?.invalid
    );
  }

  getControlError(controlName: string): string {
    const control = this.itemForm.get(controlName);

    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.labelOf(controlName)} is required.`;
    }

    if (control.errors['minlength']) {
      return `${this.labelOf(controlName)} is too short.`;
    }

    if (control.errors['email']) {
      return 'Please enter a valid email address.';
    }

    if (control.errors['pattern']) {
      if (controlName === 'username') {
        return 'Username can contain only letters, numbers, and underscore.';
      }

      return `${this.labelOf(controlName)} can contain only letters and spaces.`;
    }

    return 'Invalid value.';
  }

  private labelOf(controlName: string): string {
    const labels: any = {
      username: 'Username',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      password: 'Password',
      role: 'Role'
    };

    return labels[controlName] || controlName;
  }

  // =========================
  // SEND OTP
  // =========================

  sendOtp(): void {
    this.formMessage = '';
    this.formMessageError = false;

    if (!this.canSendOtp()) {
      this.itemForm.get('username')?.markAsTouched();
      this.itemForm.get('firstName')?.markAsTouched();
      this.itemForm.get('lastName')?.markAsTouched();
      this.itemForm.get('email')?.markAsTouched();

      this.formMessage = 'Please enter username, first name, last name, and valid email before verification.';
      this.formMessageError = true;
      return;
    }

    const email = this.normalizeEmail(this.itemForm.get('email')?.value);

    this.verifyLoading = true;
    this.otpVerified = false;
    this.verifiedEmail = '';
    this.otpSent = false;
    this.otpAttempts = 0;
    this.resetOtpInputs(true);

    this.http.sendOtp({ email }).subscribe({
      next: (res: any) => {
        this.verifyLoading = false;
        this.otpSent = true;

        this.otpMessage = res?.message || 'OTP sent successfully. Please check your email.';
        this.otpMessageType = 'success';

        this.formMessage = '';
        this.formMessageError = false;

        this.focusOtpBox(0);
      },
      error: (err) => {
        this.verifyLoading = false;
        this.otpSent = false;

        this.otpMessage = err?.error?.message || 'Failed to send OTP. Please try again.';
        this.otpMessageType = 'error';

        this.formMessage = this.otpMessage;
        this.formMessageError = true;
      }
    });
  }

  // =========================
  // OTP INPUT HELPERS
  // =========================

  private focusOtpBox(index: number): void {
    queueMicrotask(() => {
      const boxes = this.otpBoxes?.toArray();

      if (boxes && boxes[index]) {
        boxes[index].nativeElement.focus();
      }
    });
  }

  private resetOtpInputs(clearMessage: boolean = true): void {
    this.otpDigits = ['', '', '', '', '', ''];

    if (clearMessage) {
      this.otpMessage = '';
      this.otpMessageType = '';
    }

    queueMicrotask(() => {
      const boxes = this.otpBoxes?.toArray();

      if (boxes?.length) {
        boxes.forEach(b => b.nativeElement.value = '');
      }
    });
  }

  getOtpCode(): string {
    return this.otpDigits.join('');
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every(d => /^[0-9]$/.test(d));
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const raw = (input.value || '').replace(/\D/g, '');
    const digit = raw ? raw[raw.length - 1] : '';

    this.otpDigits[index] = digit;
    input.value = digit;

    if (digit && index < 5) {
      this.focusOtpBox(index + 1);
    }

    // Clear success/error text while typing, but OTP card remains because otpSent = true.
    this.otpMessage = '';
    this.otpMessageType = '';
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
        this.focusOtpBox(index - 1);

        queueMicrotask(() => {
          const boxes = this.otpBoxes?.toArray();

          if (boxes && boxes[index - 1]) {
            boxes[index - 1].nativeElement.value = '';
          }
        });
      }

      return;
    }

    if (key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusOtpBox(index - 1);
      return;
    }

    if (key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusOtpBox(index + 1);
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

      this.focusOtpBox(Math.min(text.length, 5));
    });

    this.otpMessage = '';
    this.otpMessageType = '';
  }

  // =========================
  // VERIFY OTP
  // =========================

  verifyOtp(): void {
    const email = this.normalizeEmail(this.itemForm.get('email')?.value);

    if (!email || this.itemForm.get('email')?.invalid) {
      this.otpMessage = 'Please enter a valid email first.';
      this.otpMessageType = 'error';
      return;
    }

    if (!this.otpSent) {
      this.otpMessage = 'Please request OTP first.';
      this.otpMessageType = 'warning';
      return;
    }

    if (!this.isOtpComplete()) {
      this.otpMessage = 'Please enter the complete 6-digit OTP.';
      this.otpMessageType = 'warning';
      return;
    }

    if (this.otpAttempts >= this.maxOtpAttempts) {
      this.otpMessage = 'Maximum attempts reached. Please resend OTP.';
      this.otpMessageType = 'error';
      return;
    }

    this.otpLoading = true;
    this.otpMessage = '';
    this.otpMessageType = '';

    this.http.verifyOtp({
      email,
      otp: this.getOtpCode()
    }).subscribe({
      next: (res: any) => {
        this.otpLoading = false;

        this.otpVerified = true;
        this.verifiedEmail = email;
        this.otpSent = true;
        this.otpAttempts = 0;

        this.otpMessage = res?.message || 'Email verified successfully!';
        this.otpMessageType = 'success';

        this.formMessage = '';
        this.formMessageError = false;
      },
      error: (err) => {
        this.otpLoading = false;

        this.otpVerified = false;
        this.verifiedEmail = '';

        this.otpAttempts++;

        this.otpMessage = err?.error?.message || 'Invalid or expired OTP.';
        this.otpMessageType = 'error';

        // Important: clear OTP boxes but DO NOT clear error message.
        this.resetOtpInputs(false);

        if (this.otpAttempts < this.maxOtpAttempts) {
          this.focusOtpBox(0);
        }
      }
    });
  }

  // =========================
  // REGISTER
  // =========================

  submit(): void {
    this.formMessage = '';
    this.formMessageError = false;
    this.usernameSuggestions = [];

    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      this.formMessage = 'Please fill all required fields correctly.';
      this.formMessageError = true;
      return;
    }

    const email = this.normalizeEmail(this.itemForm.value.email);
    const password = this.itemForm.value.password || '';

    if (!this.confirmPassword) {
      this.formMessage = 'Please confirm your password.';
      this.formMessageError = true;
      return;
    }

    if (password !== this.confirmPassword) {
      this.formMessage = 'Password and confirm password do not match.';
      this.formMessageError = true;
      return;
    }

    if (this.phone && !/^[0-9]{10}$/.test(this.phone.trim())) {
      this.formMessage = 'Phone number must be exactly 10 digits.';
      this.formMessageError = true;
      return;
    }

    if (!this.otpVerified || this.verifiedEmail !== email) {
      this.formMessage = 'Please verify your email OTP before registration.';
      this.formMessageError = true;
      return;
    }

    const payload = {
      username: String(this.itemForm.value.username || '').trim(),
      firstName: String(this.itemForm.value.firstName || '').trim(),
      lastName: String(this.itemForm.value.lastName || '').trim(),
      email,
      password,
      role: this.itemForm.value.role,
      phone: this.phone ? this.phone.trim() : ''
    };

    this.registrationLoading = true;

    this.http.registerUser(payload).subscribe({
      next: () => {
        this.registrationLoading = false;
        alert('Registration Successful ✅ Check your email');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.registrationLoading = false;

        const message = err?.error?.message || 'Registration failed. Please try again.';
        this.formMessage = message;
        this.formMessageError = true;

        if (err?.error?.suggestions) {
          this.usernameSuggestions = err.error.suggestions;
        }
      }
    });
  }

  onSubmit(): void {
    this.submit();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}