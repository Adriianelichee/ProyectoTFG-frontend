import { Routes, RouterModule } from '@angular/router';
import { RoomsListComponent } from './rooms-list.component';
import { RoomsDetailComponent } from './rooms-detail.component';
import { AuthGuard } from '../../core/auth/auth-guard';
import { RoomsViewComponent } from './rooms-view.component';
import {RoleGuard} from '../../core/auth/role-guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: RoomsListComponent },
      {
        path: 'new',
        component: RoomsDetailComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: {roles: ['admin', 'secretary']}
      },
      {
        path: ':id',
        component: RoomsDetailComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: {roles: ['admin', 'secretary']}
      },
      { path: ':id/view', component: RoomsViewComponent }
    ]
  }
];

export const RoomsRoutingModule = RouterModule.forChild(routes);
