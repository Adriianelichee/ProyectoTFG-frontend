import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/auth-guard';
import { ReportsComponent } from './reports.component';
import { ReportDetailComponent } from './report-detail/report-detail.component';
import {ReportViewComponent} from './report-view/report-view.component';
import {RoleGuard} from '../../core/auth/role-guard';
import {ReportViewUserComponent} from './report-view-user/report-view-user.component';

const routes: Routes = [
  {
    path: '',
    component: ReportsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'secretary'] },
    title: 'Reportes'
  },
  {
    path: 'new',
    component: ReportDetailComponent,
    canActivate: [AuthGuard],
    title: 'Nuevo Reporte'
  },
  {
    path: 'view',
    component: ReportViewUserComponent,
    canActivate: [AuthGuard],
    title: 'Reportes de Usuario'
  },
  {
    path: ':id',
    component: ReportViewComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin', 'secretary'] },
    title: 'Detalle de Reporte'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
