import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FloorsRoutingModule } from './floors-routing-module';
import { FloorsListComponent } from './floors-list.component';
import { FloorsDetailComponent } from './floors-detail.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FloorsRoutingModule,
    FloorsListComponent,
    FloorsDetailComponent
  ]
})
export class FloorsModule {}
