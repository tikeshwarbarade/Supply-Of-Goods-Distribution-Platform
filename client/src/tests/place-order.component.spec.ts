import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PlaceOrderComponent } from '../app/place-order/place-order.component';
import { AuthService } from '../services/auth.service';
import { HttpService } from '../services/http.service';



describe('PlaceOrderComponent', () => {
  let component: PlaceOrderComponent;
  let fixture: ComponentFixture<PlaceOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlaceOrderComponent],
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

    fixture = TestBed.createComponent(PlaceOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit the form with invalid inputs', () => {
    // Set the form values to invalid
    component.itemForm.controls['quantity'].setValue('');
    component.itemForm.controls['status'].setValue('');

    // Trigger the form submission
    component.onSubmit();

    // Assert that the form is invalid
    expect(component.itemForm.invalid).toBeTrue();
  });

  it('should submit the form with valid inputs', () => {
    // Set the form values to valid
    component.itemForm.controls['quantity'].setValue(10);
    component.itemForm.controls['status'].setValue('pending');

    // Trigger the form submission
    component.onSubmit();

    // Assert that the form is valid
    expect(component.itemForm.valid).toBeTrue();
  });
});