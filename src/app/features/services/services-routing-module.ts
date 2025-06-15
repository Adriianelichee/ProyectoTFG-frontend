import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

// Importamos los componentes que necesitarán rutas
import {ServicesDetailComponent} from './services-detail.component';
import {ServicesListComponent} from './services-list.component';
import {PurchasedServicesListComponent} from './purchased-services/purchased-services-list.component';
import {PurchasedServicesDetailComponent} from './purchased-services/purchased-services-detail.component';
import {CleaningRequestsComponent} from './cleaning/cleaning-requests.component';
import {CleaningFormComponent} from './cleaning/cleaning-form.component';
import {ServicesViewComponent} from './services-view.component';
import {PurchasedViewComponent} from './purchased-services/purchased-view.component';
import {AuthGuard} from '../../core/auth/auth-guard';
import {RoleGuard} from '../../core/auth/role-guard';

const routes: Routes = [
  // Servicios básicos
  {path: '', component: ServicesListComponent},
  {
    path: 'new',
    component: ServicesDetailComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {roles: ['admin', 'secretary']}
  },
  {path: 'purchased', component: PurchasedServicesListComponent},
  {
    path: 'purchased/new',
    component: PurchasedServicesDetailComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'purchased/:id',
    component: PurchasedServicesDetailComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {roles: ['admin', 'secretary']}
  },
  {path: 'purchased/:id/view', component: PurchasedViewComponent},

  // Servicios de limpieza (también antes de las rutas con parámetros)
  {
    path: 'cleaning/requests',
    component: CleaningRequestsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {roles: ['admin', 'secretary']}
  },
  {path: 'cleaning/new', component: CleaningFormComponent},

  // Rutas con parámetros al final (para que no intercepten las rutas específicas)
  {
    path: ':id',
    component: ServicesDetailComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {roles: ['admin', 'secretary']}
  },
  {path: ':id/view', component: ServicesViewComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServicesRoutingModule {
}
