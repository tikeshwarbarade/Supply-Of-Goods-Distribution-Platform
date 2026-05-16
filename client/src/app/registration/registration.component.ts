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
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    role: [null as any, Validators.required]
  });

  companyName = '';
  phone = '';
  confirmPassword = '';

  showPassword = false;
  showConfirmPassword = false;

  formMessage = '';
  formMessageError = false;

  // ================= OTP VARIABLES =================

  otpDigits: string[] = ['', '', '', '', '', ''];
  otpVerified = false;
  verifiedEmail = '';
  otpLoading = false;
  verifyLoading = false;
  otpMessage = '';
  otpMessageType: 'success' | 'error' | 'warning' | '' = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpService,
    private router: Router
  ) {}

  // ================= PASSWORD TOGGLE =================

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  trackByIndex(index: number): number {
    return index;
  }

  // ================= SEND OTP =================

  sendOtp() {
    const email = this.itemForm.get('email')?.value;

    if (!email || this.itemForm.get('email')?.invalid) {
      this.formMessage = 'Please enter a valid email address first.';
      this.formMessageError = true;
      return;
    }

    this.verifyLoading = true;
    this.otpVerified = false;
    this.verifiedEmail = '';
    this.resetOtpInputs();

    this.http.sendOtp({ email }).subscribe({
      next: (res: any) => {
        this.verifyLoading = false;

        this.otpMessage = res?.message || 'OTP sent successfully. Please check your email.';
        this.otpMessageType = 'success';

        this.formMessage = '';
        this.formMessageError = false;

        this.focusOtpBox(0);
      },
      error: (err) => {
        this.verifyLoading = false;

        this.otpMessage = err?.error?.message || 'Failed to send OTP. Please try again.';
        this.otpMessageType = 'error';

        this.formMessage = this.otpMessage;
        this.formMessageError = true;
      }
    });
  }

  // ================= OTP INPUT HELPERS =================

  private focusOtpBox(index: number) {
    queueMicrotask(() => {
      const boxes = this.otpBoxes?.toArray();

      if (boxes && boxes[index]) {
        boxes[index].nativeElement.focus();
      }
    });
  }

  private resetOtpInputs() {
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpMessage = '';
    this.otpMessageType = '';

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

  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const raw = (input.value || '').replace(/\D/g, '');
    const digit = raw ? raw[raw.length - 1] : '';

    this.otpDigits[index] = digit;
    input.value = digit;

    if (digit && index < 5) {
      this.focusOtpBox(index + 1);
    }

    this.otpMessage = '';
    this.otpMessageType = '';
  }

  onOtpKeyDown(event: KeyboardEvent, index: number) {
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

  onOtpPaste(event: ClipboardEvent) {
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

  // ================= VERIFY OTP =================

  verifyOtp() {
    const email = this.itemForm.get('email')?.value;

    if (!email || this.itemForm.get('email')?.invalid) {
      this.otpMessage = 'Please enter a valid email first.';
      this.otpMessageType = 'error';
      return;
    }

    if (!this.isOtpComplete()) {
      this.otpMessage = 'Please enter the complete 6-digit OTP.';
      this.otpMessageType = 'warning';
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

        this.otpMessage = res?.message || 'Email verified successfully!';
        this.otpMessageType = 'success';

        this.formMessage = '';
        this.formMessageError = false;
      },
      error: (err) => {
        this.otpLoading = false;

        this.otpVerified = false;
        this.verifiedEmail = '';

        this.otpMessage = err?.error?.message || 'Invalid or expired OTP.';
        this.otpMessageType = 'error';

        this.resetOtpInputs();
        this.focusOtpBox(0);
      }
    });
  }

  // ================= REGISTER =================

  submit() {
    this.formMessage = '';
    this.formMessageError = false;

    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      this.formMessage = 'Please fill all required fields correctly.';
      this.formMessageError = true;
      return;
    }

    const email = this.itemForm.value.email;
    const password = this.itemForm.value.password;

    if (this.confirmPassword && password !== this.confirmPassword) {
      this.formMessage = 'Password and confirm password do not match.';
      this.formMessageError = true;
      return;
    }

    if (!this.isOtpComplete()) {
      this.formMessage = 'Please enter the 6-digit OTP.';
      this.formMessageError = true;
      return;
    }

    if (!this.otpVerified || this.verifiedEmail !== email) {
      this.formMessage = 'Please verify your email OTP before registration.';
      this.formMessageError = true;
      return;
    }

    const payload = {
      ...this.itemForm.value,
      phone: this.phone,
      otp: this.getOtpCode()
    };

    this.http.registerUser(payload).subscribe({
      next: () => {
        alert('Registration Successful ✅ Check your email');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error(err);
        this.formMessage = err?.error?.message || 'Registration failed. Username or email may already exist.';
        this.formMessageError = true;
        alert('Registration failed ❌');
      }
    });
  }

  onSubmit() {
    this.submit();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}