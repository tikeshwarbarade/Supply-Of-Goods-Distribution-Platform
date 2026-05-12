import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { AppComponent } from './app.component';
import { DashbaordComponent } from './dashbaord/dashbaord.component';
import { CreateProductsComponent } from './create-products/create-products.component';



import { PlaceOrderComponent } from './place-order/place-order.component';
import { GetOrdersComponent } from './get-orders/get-orders.component';

import { AddInventoryComponent } from './add-inventory/add-inventory.component';
import { ConsumerPlaceOrderComponent } from './consumer-place-order/consumer-place-order.component';
import { ConsumerGetOrdersComponent } from './consumer-get-orders/consumer-get-orders.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },
  { path: 'dashboard', component: DashbaordComponent },  
  { path: 'create-product', component: CreateProductsComponent }, 
  { path: 'place-product', component: PlaceOrderComponent }, 
  { path: 'add-inventory', component: AddInventoryComponent }, 
  { path: 'get-orders', component: GetOrdersComponent }, 
 { path: 'consumer-place-order', component: ConsumerPlaceOrderComponent }, 
 { path: 'consumer-get-orders', component: ConsumerGetOrdersComponent }, 
 
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  { path: '**', redirectTo: '/dashboard', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
