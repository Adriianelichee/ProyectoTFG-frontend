// src/app/app-routing.ts
  import { Routes } from '@angular/router';
  import { AuthGuard } from './core/auth/auth-guard';
  import { FloorsViewComponent } from './features/floors/floors-view.component';


  export const routes: Routes = [
    { path: 'home', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
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
    {
      path: 'workstations',
      loadChildren: () => import('./features/workstation/workstation-module').then(m => m.WorkstationModule),
      canActivate: [AuthGuard]
    },
    {
      path: 'services',
      loadChildren: () => import('./features/services/services-routing-module').then(m => m.ServicesRoutingModule),
      canActivate: [AuthGuard]
    },

    {
      path: 'floors/:id/view',
      component: FloorsViewComponent,
      canActivate: [AuthGuard]
    },

    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: '**', redirectTo: 'home' }
  ];
