import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AddInventoryComponent } from '../app/add-inventory/add-inventory.component';
import { HttpService } from '../services/http.service';
import { AuthService } from '../services/auth.service';

describe('AddInventoryComponent', () => {
  let component: AddInventoryComponent;
  let fixture: ComponentFixture<AddInventoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddInventoryComponent],
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

    fixture = TestBed.createComponent(AddInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit the form with invalid inputs', () => {
    // Set the form values to invalid
    component.itemForm.controls['stockQuantity'].setValue('');
    component.itemForm.controls['productId'].setValue('');

    // Trigger the form submission
    component.onSubmit();

    // Assert that the form is invalid
    expect(component.itemForm.invalid).toBeTrue();
  });

  it('should submit the form with valid inputs', () => {
    // Set the form values to valid
    component.itemForm.controls['stockQuantity'].setValue(100);
    component.itemForm.controls['productId'].setValue(1);

    // Trigger the form submission
    component.onSubmit();

    // Assert that the form is valid
    expect(component.itemForm.valid).toBeTrue();
  });
});