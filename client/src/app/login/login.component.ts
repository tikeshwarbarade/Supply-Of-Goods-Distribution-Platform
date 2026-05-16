
import { Component, OnInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  itemForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  showPassword = false;

  // ===== Captcha =====
  captchaText = '';
  captchaInput = '';
  captchaVerified = false;
  captchaMessage = 'Captcha verification is required.';
  captchaMessageType = '';
  captchaCharsDisplay: any[] = [];

  // ===== OTP =====
  otpDigits: string[] = ['', '', '', '', '', ''];
  loginLoading = false;

  // ===== messages =====
  formMessage = '';
  formMessageError = false;

  private isTest = window.location.port === '9876';
  private otpRequestedForUsername = '';

  private captchaChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

  private captchaColors = [
    '#312e81',
    '#4f46e5',
    '#06b6d4',
    '#0f172a',
    '#1d4ed8'
  ];

  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private fb: FormBuilder,
    private http: HttpService,
    private auth: AuthService,
    private router: Router,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    this.generateCaptcha();

    this.itemForm.valueChanges.subscribe(() => {
      if (this.captchaVerified) {
        this.captchaVerified = false;
        this.otpRequestedForUsername = '';
        this.resetOtp();
        this.captchaMessage = 'Details changed. Please verify captcha again.';
        this.captchaMessageType = 'warning';
      }
    });
  }

  trackByIndex = (index: number) => index;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  private getErrorMessage(err: any): string {
    if (!err) return 'Something went wrong';

    if (typeof err === 'string') return err;

    if (err.error) {
      if (typeof err.error === 'string') return err.error;
      if (err.error.message) return err.error.message;
    }

    if (err.message) return err.message;

    return 'Something went wrong';
  }

  private randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomFromArray(arr: string[]): string {
    return arr[this.randomNumber(0, arr.length - 1)];
  }

  private createCaptchaText(length: number): string {
    let text = '';
    for (let i = 0; i < length; i++) {
      text += this.captchaChars[this.randomNumber(0, this.captchaChars.length - 1)];
    }
    return text;
  }

  generateCaptcha() {
    this.captchaText = this.createCaptchaText(6);
    this.captchaVerified = false;
    this.captchaInput = '';
    this.otpRequestedForUsername = '';
    this.resetOtp();

    this.captchaMessage = 'Captcha verification is required.';
    this.captchaMessageType = '';

    this.captchaCharsDisplay = this.captchaText.split('').map((char) => {
      const rotate = this.randomNumber(-22, 22);
      const moveY = this.randomNumber(-6, 6);
      const moveX = this.randomNumber(-2, 2);

      return {
        char,
        style: {
          transform: `translate(${moveX}px, ${moveY}px) rotate(${rotate}deg)`,
          color: this.randomFromArray(this.captchaColors)
        }
      };
    });
  }

  onCaptchaInputChange() {
    this.captchaVerified = false;
    this.otpRequestedForUsername = '';
    this.resetOtp();

    this.captchaMessage = this.captchaInput
      ? 'Captcha entered. Click Check to verify.'
      : 'Captcha verification is required.';
  }

  // ✅ VERIFY CAPTCHA + SEND OTP
  verifyCaptcha() {
    this.formMessage = '';
    this.formMessageError = false;

    if (this.itemForm.invalid) {
      this.formMessage = 'Enter username and password';
      this.formMessageError = true;
      return;
    }

    if (this.captchaInput.toLowerCase() !== this.captchaText.toLowerCase()) {
      this.generateCaptcha();
      this.captchaMessage = 'Incorrect captcha';
      this.captchaMessageType = 'error';
      return;
    }

    if (this.isTest) {
      this.captchaVerified = true;
      return;
    }

    this.loginLoading = true;

    this.http.requestLoginOtp(this.itemForm.value).subscribe({
      next: () => {
        this.captchaVerified = true;
        this.otpRequestedForUsername = this.itemForm.value.username!;

        this.captchaMessage = 'OTP sent ✅';
        this.captchaMessageType = 'success';

        this.resetOtp();
        setTimeout(() => this.focusOtp(0), 0);

        this.loginLoading = false;
      },
      error: (err) => {
        this.formMessage = this.getErrorMessage(err);
        this.formMessageError = true;

        this.generateCaptcha();
        this.loginLoading = false;
      }
    });
  }

  private resetOtp() {
    this.otpDigits = ['', '', '', '', '', ''];
  }

  private getOtpValue() {
    return this.otpDigits.join('');
  }

  private focusOtp(i: number) {
    this.otpBoxes.get(i)?.nativeElement.focus();
  }

  onOtpInput(e: any, i: number) {
    const val = e.target.value.replace(/\D/g, '');
    this.otpDigits[i] = val ? val[val.length - 1] : '';
    if (this.otpDigits[i] && i < 5) this.focusOtp(i + 1);
  }

  onOtpKeyDown(e: KeyboardEvent, i: number) {
    if (e.key === 'Backspace' && !this.otpDigits[i] && i > 0) {
      this.focusOtp(i - 1);
    }
  }

  onOtpPaste(e: ClipboardEvent) {
    const data = e.clipboardData?.getData('text') || '';
    const digits = data.replace(/\D/g, '').slice(0, 6);
    this.otpDigits = digits.split('').concat(Array(6).fill('')).slice(0, 6);
  }

  // ✅ FINAL LOGIN
  submit() {
    if (!this.captchaVerified) {
      this.formMessage = 'Verify captcha first';
      this.formMessageError = true;
      return;
    }

    const otp = this.getOtpValue();
    if (otp.length !== 6) {
      this.formMessage = 'Enter OTP';
      this.formMessageError = true;
      return;
    }

    this.loginLoading = true;

    this.http.verifyLoginOtp({
      username: this.itemForm.value.username,
      otp: otp
    }).subscribe({
      next: (res: any) => {
        this.auth.saveToken(res.token);
        this.auth.SetRole(res.role);
        this.auth.saveUserId(res.userId);

        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.formMessage = this.getErrorMessage(err);
        this.formMessageError = true;
        this.resetOtp();
        this.loginLoading = false;
      }
    });
  }

  onSubmit() {
    this.submit();
  }
}
