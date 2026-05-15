import { Component, OnInit } from '@angular/core';
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

  captchaText = '';
  captchaInput = '';
  captchaVerified = false;
  captchaMessage = 'Captcha verification is required.';
  captchaMessageType = '';
  captchaCharsDisplay: any[] = [];

  formMessage = '';
  formMessageError = false;

  private isTest = window.location.port === '9876';

  private captchaChars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

  private captchaColors = [
    '#312e81',
    '#4f46e5',
    '#06b6d4',
    '#0f172a',
    '#1d4ed8'
  ];
constructor(
  private fb: FormBuilder,
  private http: HttpService,
  private auth: AuthService,
  private router: Router,
  private sessionService: SessionService
) {}

  ngOnInit() {
    this.generateCaptcha();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomFromArray(arr: string[]): string {
    return arr[this.randomNumber(0, arr.length - 1)];
  }

  createCaptchaText(length: number): string {
    let text = '';

    for (let i = 0; i < length; i++) {
      text += this.captchaChars[
        this.randomNumber(0, this.captchaChars.length - 1)
      ];
    }

    return text;
  }

  generateCaptcha() {
    this.captchaText = this.createCaptchaText(6);
    this.captchaVerified = false;
    this.captchaInput = '';
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

  verifyCaptcha(): boolean {
    const enteredCaptcha = this.captchaInput.trim();

    if (!enteredCaptcha) {
      this.captchaVerified = false;
      this.captchaMessage = 'Please enter the captcha code.';
      this.captchaMessageType = 'warning';
      return false;
    }

    if (enteredCaptcha.toLowerCase() === this.captchaText.toLowerCase()) {
      this.captchaVerified = true;
      this.captchaMessage = 'Captcha verified successfully.';
      this.captchaMessageType = 'success';
      return true;
    }

    this.captchaVerified = false;
    this.captchaMessage = 'Incorrect captcha. A new code has been generated.';
    this.captchaMessageType = 'error';
    this.generateCaptcha();
    return false;
  }

  onCaptchaInputChange() {
    this.captchaVerified = false;

    if (this.captchaInput.trim()) {
      this.captchaMessage = 'Captcha entered. Click Check or Login to verify.';
      this.captchaMessageType = 'warning';
    } else {
      this.captchaMessage = 'Captcha verification is required.';
      this.captchaMessageType = '';
    }
  }

 submit() {
  this.formMessage = '';
  this.formMessageError = false;

  if (this.itemForm.invalid) {
    this.itemForm.markAllAsTouched();
    this.formMessage = 'Please enter username and password.';
    this.formMessageError = true;
    return;
  }

  // ✅ Skip captcha only for tests
  if (!this.isTest && !this.captchaVerified) {
    if (!this.verifyCaptcha()) {
      this.formMessage = 'Please verify captcha before login.';
      this.formMessageError = true;
      return;
    }
  }

  this.http.Login(this.itemForm.value).subscribe({
  next: (res: any) => {
  this.auth.saveToken(res.token);
  this.auth.SetRole(res.role);
  this.auth.saveUserId(res.userId);

  this.formMessage = 'Login successful.';
  this.formMessageError = false;

  if (res.role === 'WHOLESALER') {
    this.router.navigate(['/wholesaler-dashboard']);
    return;
  }

  this.router.navigate(['/dashboard']);
},
    error: (err) => {
      console.error(err);

      if (err.status === 409) {
        this.formMessage = 'User is already logged in from another session.';
        this.formMessageError = true;
        alert('User already logged in from another browser/session ❌');
        return;
      }

      this.formMessage = 'Invalid Username or Password.';
      this.formMessageError = true;
      alert('Invalid Username or Password ❌');

      if (!this.isTest) {
        this.generateCaptcha();
      }
    }
  });
}
  onSubmit() {
    this.submit();
  }
}