// src/app/app-routing.ts
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './core/auth/login/login.component';
import { RegisterComponent } from './core/auth/register/register.component';
import { AuthGuard } from './core/auth/auth-guard';

export const routes: Routes = [
  { path: 'auth/login', loadComponent: () => import('./core/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./core/auth/register/register.component').then(m => m.RegisterComponent) },

  { path: 'floors',
    loadChildren: () => import('./features/floors/floors-module').then(m => m.FloorsModule),
    canActivate: [AuthGuard]
  },
  { path: 'rooms',
    loadChildren: () => import('./features/rooms/rooms-module').then(m => m.RoomsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'companies',
    loadChildren: () => import('./features/companies/companies-module').then(m => m.CompaniesModule),
    canActivate: [AuthGuard]
  },

  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: 'floors' }
];

