import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Importamos los componentes que necesitarán rutas
import { ServicesDetailComponent } from './services-detail.component';
import { ServicesListComponent } from './services-list.component';
import { PurchasedServicesListComponent } from './purchased-services/purchased-services-list.component';
import { PurchasedServicesDetailComponent } from './purchased-services/purchased-services-detail.component';
import { CleaningRequestsComponent } from './cleaning/cleaning-requests.component';
import { CleaningFormComponent } from './cleaning/cleaning-form.component';
import {ServicesViewComponent} from './services-view.component';

const routes: Routes = [
  // Servicios básicos
  { path: '', component: ServicesListComponent },
  { path: 'new', component: ServicesDetailComponent },

  // Servicios adquiridos (colocados ANTES de las rutas con parámetros)
  { path: 'purchased', component: PurchasedServicesListComponent },
  { path: 'purchased/new', component: PurchasedServicesDetailComponent },
  { path: 'purchased/:id', component: PurchasedServicesDetailComponent },
  { path: 'purchased/:id/view', component: PurchasedServicesDetailComponent },

  // Servicios de limpieza (también antes de las rutas con parámetros)
  { path: 'cleaning/requests', component: CleaningRequestsComponent },
  { path: 'cleaning/new', component: CleaningFormComponent },
  { path: 'cleaning/:id', component: CleaningFormComponent },
  { path: 'cleaning/:id/view', component: CleaningFormComponent },

  // Rutas con parámetros al final (para que no intercepten las rutas específicas)
  { path: ':id', component: ServicesDetailComponent },
  { path: ':id/view', component: ServicesViewComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServicesRoutingModule { }
