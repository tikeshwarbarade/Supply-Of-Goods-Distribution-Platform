import { Component } from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent {

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

  constructor(
    private fb: FormBuilder,
    private http: HttpService,
    private router: Router
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submit() {
    this.formMessage = '';
    this.formMessageError = false;

    if (this.itemForm.invalid) {
      this.formMessage = 'Please fill all required fields correctly.';
      this.formMessageError = true;
      return;
    }

    const password = this.itemForm.value.password;

    if (this.confirmPassword && password !== this.confirmPassword) {
      this.formMessage = 'Password and confirm password do not match.';
      this.formMessageError = true;
      return;
    }

    // ✅ Only itemForm value is sent to backend.
    // ✅ companyName and phone are mock UI fields only.
    this.http.registerUser(this.itemForm.value).subscribe({
      next: () => {
        alert('Registration Successful ✅');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error(err);
        this.formMessage = 'Registration failed. Username may already exist.';
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