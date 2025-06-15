import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ReservationsComponent} from './reservations.component';
import {DetailReservationsWorkstationsComponent} from './detail-reservations-workstations/detail-reservations-workstations.component';
import {DetailReservationsRoomsComponent} from './detail-reservations-rooms/detail-reservations-rooms.component';

const routes: Routes = [
  {path: '', component: ReservationsComponent},
  {path: 'workstation/:id', component: DetailReservationsWorkstationsComponent},
  {path: 'room/:id', component: DetailReservationsRoomsComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReservationsRoutingModule {
}
