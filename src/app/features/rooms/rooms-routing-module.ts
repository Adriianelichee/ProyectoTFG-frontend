// src/app/features/rooms/rooms-routing.ts
import { Routes, RouterModule } from '@angular/router';
import { RoomsListComponent } from './rooms-list.component';
import { RoomsDetailComponent } from './rooms-detail.component';
import { AuthGuard } from '../../core/auth/auth-guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: RoomsListComponent },
      { path: 'new', component: RoomsDetailComponent },
      { path: ':id', component: RoomsDetailComponent }
    ]
  }
];

export const RoomsRoutingModule = RouterModule.forChild(routes);
