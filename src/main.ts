// src/main.ts
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app/app';
import { routes } from './app/app.routes';
import { JwtInterceptor } from './app/core/auth/jwt-interceptor';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    // 1) Importar HttpClientModule para que HttpClient esté disponible:
    importProvidersFrom(HttpClientModule),

    // 2) Registrar nuestro JwtInterceptor como HTTP_INTERCEPTOR:
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    },

    // 3) Registrar las rutas de la aplicación
    provideRouter(routes)
  ]
})
  .catch(err => console.error(err));
