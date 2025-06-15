import {NgModule} from '@angular/core';
import {CompaniesRoutingModule} from './companies-routing-module';

// Creamos un modulo para gestionar la funcionalidad de empresas. Creamos el modulo tambien para cada componente, identificarlo facilmente
@NgModule({
  imports: [
    // Importamos el modulo de rutas para la navegacion de empresas
    CompaniesRoutingModule,
  ]
})
// Definimos la clase del modulo que contendrá los componentes
export class CompaniesModule {
}
