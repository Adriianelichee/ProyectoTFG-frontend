import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '../../core/auth/auth-guard';
import {PaymentsComponent} from './payments.component';

const routes: Routes = [
  {
    path: 'process',
    component: PaymentsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: ':id',
    component: PaymentsComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentsRoutingModule {
}
