import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportProviderListComponent } from './report-provider-list.component';
import { ReportProviderDetailsComponent } from './report-provider-details.component';
import { AuthGuard } from '../../core/auth/auth-guard';
import { AdminGuard } from '../../core/auth/admin-guard';

const routes: Routes = [
  {
    path: '',
    component: ReportProviderListComponent,
    canActivate: [AuthGuard, AdminGuard],
    title: 'Proveedores de Reportes'
  },
  {
    path: 'new',
    component: ReportProviderDetailsComponent,
    canActivate: [AuthGuard, AdminGuard],
    title: 'Nuevo Proveedor de Reportes'
  },
  {
    path: ':id',
    component: ReportProviderDetailsComponent,
    canActivate: [AuthGuard, AdminGuard],
    title: 'Detalles del Proveedor'
  },
  {
    path: ':id/edit',
    component: ReportProviderDetailsComponent,
    canActivate: [AuthGuard, AdminGuard],
    title: 'Editar Proveedor'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportProviderRoutingModule { }
