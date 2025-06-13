import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {FloorsListComponent} from './floors-list.component';
import {FloorsDetailComponent} from './floors-detail.component';
import {FloorsViewComponent} from './floors-view.component';
import {AuthGuard} from '../../core/auth/auth-guard';
import {RoleGuard} from '../../core/auth/role-guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {path: '', component: FloorsListComponent},
      {
        path: 'new',
        component: FloorsDetailComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: {roles: ['admin', 'secretary']}
      },
      {
        path: ':id',
        component: FloorsDetailComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: {roles: ['admin', 'secretary']}
      },
      {path: ':id/view', component: FloorsViewComponent}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FloorsRoutingModule {
}
