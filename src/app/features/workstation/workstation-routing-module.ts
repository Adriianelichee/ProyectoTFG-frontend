import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkstationListComponent } from './workstation-list.component';
import { WorkstationDetailsComponent } from './workstation-details.component';
import {WorkstationViewComponent} from './workstation-view.component';

const routes: Routes = [
  {
    path: '',
    component: WorkstationListComponent
  },
  {
    path: 'new',
    component: WorkstationDetailsComponent
  },
  {
    path: 'edit/:id',
    component: WorkstationDetailsComponent
  },
  {
    path: ':id/view',
    component: WorkstationViewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkstationRoutingModule { }
