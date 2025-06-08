// src/app/features/rooms/rooms-routing.ts
import { Routes, RouterModule } from '@angular/router';
import { RoomsListComponent } from './rooms-list.component';
import { RoomsDetailComponent } from './rooms-detail.component';
import { AuthGuard } from '../../core/auth/auth-guard';
import { RoomsViewComponent } from './rooms-view.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: RoomsListComponent },
      { path: 'new', component: RoomsDetailComponent },
      { path: ':id', component: RoomsDetailComponent },
      { path: ':id/view', component: RoomsViewComponent }
    ]
  }
];

export const RoomsRoutingModule = RouterModule.forChild(routes);
