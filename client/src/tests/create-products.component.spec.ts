import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CreateProductsComponent } from '../app/create-products/create-products.component';
import { AuthService } from '../services/auth.service';
import { HttpService } from '../services/http.service';



describe('CreateProductsComponent', () => {
  let component: CreateProductsComponent;
  let fixture: ComponentFixture<CreateProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateProductsComponent],
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        HttpService,
        AuthService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit the form with invalid inputs', () => {
    // Set the form values to invalid
    component.itemForm.controls['name'].setValue('');
    component.itemForm.controls['description'].setValue('');
    component.itemForm.controls['price'].setValue('');
    component.itemForm.controls['stockQuantity'].setValue('');

    // Trigger the form submission
    component.onSubmit();

    // Assert that the form is invalid
    expect(component.itemForm.invalid).toBeTrue();
  });

  it('should submit the form with valid inputs', () => {
    // Set the form values to valid
    component.itemForm.controls['name'].setValue('Test Product');
    component.itemForm.controls['description'].setValue('This is a test product');
    component.itemForm.controls['price'].setValue(10.99);
    component.itemForm.controls['stockQuantity'].setValue(100);

    // Trigger the form submission
    component.onSubmit();

    // Assert that the form is valid
    expect(component.itemForm.valid).toBeTrue();
  });
});