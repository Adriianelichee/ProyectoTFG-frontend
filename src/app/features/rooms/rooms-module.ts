// src/app/features/rooms/rooms.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RoomsRoutingModule } from './rooms-routing-module';
import { RoomsListComponent } from './rooms-list.component';
import { RoomsDetailComponent } from './rooms-detail.component';

@NgModule({
  imports: [
    RoomsRoutingModule,
  ]
})
export class RoomsModule {}
