import { Routes, RouterModule } from '@angular/router';
import { CompaniesListComponent } from './companies-list.component';
import { CompaniesDetailComponent } from './companies-detail.component';
import { AuthGuard } from '../../core/auth/auth-guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: CompaniesListComponent },
      { path: 'new', component: CompaniesDetailComponent },
      { path: ':id', component: CompaniesDetailComponent }
    ]
  }
];

export const CompaniesRoutingModule = RouterModule.forChild(routes);
