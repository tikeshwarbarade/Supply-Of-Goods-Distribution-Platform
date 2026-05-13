import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {

  itemForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private http: HttpService,
    private auth: AuthService,
    private router: Router
  ) {}

  submit() {
    if (this.itemForm.invalid) return;

    this.http.Login(this.itemForm.value).subscribe((res: any) => {

      this.auth.saveToken(res.token);
      this.auth.SetRole(res.role);
      this.auth.saveUserId(res.userId);

      this.router.navigate(['/dashboard']);

      
    });
  }

  onSubmit() {
    this.submit();
  }
}