import {Routes, RouterModule} from '@angular/router';
import {CompaniesListComponent} from './companies-list.component';
import {CompaniesDetailComponent} from './companies-detail.component';
import {AuthGuard} from '../../core/auth/auth-guard';
import {RoleGuard} from '../../core/auth/role-guard';

// Definimos las rutas del modulo de empresas
const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard], // Protegemos todas las rutas del modulo con autenticacion
    children: [
      {
        path: '',
        component: CompaniesListComponent, // Componente para listar empresas
        canActivate: [AuthGuard, RoleGuard], // Aplicamos dos guardias para proteger la ruta
        data: {roles: ['admin', 'secretary']} // Solo estos roles pueden acceder
      },
      {
        path: 'new',
        component: CompaniesDetailComponent, // Componente para crear nuevas empresas
        canActivate: [AuthGuard, RoleGuard], // Verificamos autenticacion y roles
        data: {roles: ['admin', 'secretary']} // Limitamos el acceso a estos perfiles
      },
      {
        path: ':id',
        component: CompaniesDetailComponent, // Componente para editar empresas existentes
        canActivate: [AuthGuard, RoleGuard], // Doble capa de seguridad en la ruta
        data: {roles: ['admin', 'secretary']} // Restringimos el acceso por roles
      }
    ]
  }
];

// Exportamos el modulo de rutas configurado para el modulo de empresas
export const CompaniesRoutingModule = RouterModule.forChild(routes);
