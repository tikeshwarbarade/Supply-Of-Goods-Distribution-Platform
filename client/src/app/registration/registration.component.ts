import { Component } from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html'
})
export class RegistrationComponent {

  itemForm = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    role: [null as any, Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private http: HttpService,
    private router: Router
  ) {}

  submit() {
    if (this.itemForm.invalid) return;
this.http.registerUser(this.itemForm.value).subscribe({
  next: () => {
    alert("Registration Successful ✅");
    this.router.navigate(['/login']);
  },
  error: () => {
    alert("Registration failed ❌");
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