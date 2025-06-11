// src/app/features/companies/companies.module.ts
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {CompaniesRoutingModule} from './companies-routing-module';
import {CompaniesListComponent} from './companies-list.component';
import {CompaniesDetailComponent} from './companies-detail.component';

@NgModule({
  imports: [
    CompaniesRoutingModule,
  ]
})
export class CompaniesModule {
}
