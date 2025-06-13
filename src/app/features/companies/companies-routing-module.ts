import {Routes, RouterModule} from '@angular/router';
import {CompaniesListComponent} from './companies-list.component';
import {CompaniesDetailComponent} from './companies-detail.component';
import {AuthGuard} from '../../core/auth/auth-guard';
import {RoleGuard} from '../../core/auth/role-guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: CompaniesListComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: {roles: ['admin', 'secretary']}
      },
      {
        path: 'new',
        component: CompaniesDetailComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: {roles: ['admin', 'secretary']}
      },
      {
        path: ':id',
        component: CompaniesDetailComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: {roles: ['admin', 'secretary']}
      }
    ]
  }
];

export const CompaniesRoutingModule = RouterModule.forChild(routes);
