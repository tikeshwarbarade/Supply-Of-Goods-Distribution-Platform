import { NgModule } from '@angular/core';


import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { DashbaordComponent } from './dashbaord/dashbaord.component';

import { CreateProductsComponent } from './create-products/create-products.component';
import { PlaceOrderComponent } from './place-order/place-order.component';
import { GetOrdersComponent } from './get-orders/get-orders.component';
import { AddInventoryComponent } from './add-inventory/add-inventory.component';

import { ConsumerPlaceOrderComponent } from './consumer-place-order/consumer-place-order.component';
import { ConsumerGetOrdersComponent } from './consumer-get-orders/consumer-get-orders.component';

import { ManufacturerDashboardComponent } from './manufacturer-dashboard/manufacturer-dashboard.component';
import { WholesalerDashboardComponent } from './wholesaler-dashboard/wholesaler-dashboard.component';
import { ConsumerDashboardComponent } from './consumer-dashboard/consumer-dashboard.component';

import { AuthGuard } from '../services/auth.guard';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';

const routes: Routes = [
  // Landing page
  { path: '', component: LandingComponent },

  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },

  // Role redirector
  { path: 'dashboard', component: DashbaordComponent, canActivate: [AuthGuard] },

  // Role dashboards
  { path: 'manufacturer-dashboard', component: ManufacturerDashboardComponent, canActivate: [AuthGuard] },
  { path: 'wholesaler-dashboard', component: WholesalerDashboardComponent, canActivate: [AuthGuard] },
  { path: 'consumer-dashboard', component: ConsumerDashboardComponent, canActivate: [AuthGuard] },

  // Manufacturer
  { path: 'create-product', component: CreateProductsComponent, canActivate: [AuthGuard] },

  // Wholesaler old/standalone routes
  { path: 'place-product', component: PlaceOrderComponent, canActivate: [AuthGuard] },
  { path: 'add-inventory', component: AddInventoryComponent, canActivate: [AuthGuard] },
  { path: 'get-orders', component: GetOrdersComponent, canActivate: [AuthGuard] },

  // Consumer
  { path: 'consumer-place-order', component: ConsumerPlaceOrderComponent, canActivate: [AuthGuard] },
  { path: 'consumer-get-orders', component: ConsumerGetOrdersComponent, canActivate: [AuthGuard] },

  // Wrong URL
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

