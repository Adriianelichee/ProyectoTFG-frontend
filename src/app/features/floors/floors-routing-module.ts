import { Routes, RouterModule } from '@angular/router';
import { FloorsListComponent } from './floors-list.component';
import { FloorsDetailComponent } from './floors-detail.component';
import { AuthGuard } from '../../core/auth/auth-guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: FloorsListComponent },
      { path: 'new', component: FloorsDetailComponent },
      { path: ':id', component: FloorsDetailComponent }
    ]
  }
];

export const FloorsRoutingModule = RouterModule.forChild(routes);
