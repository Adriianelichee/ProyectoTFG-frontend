import { TestBed } from '@angular/core/testing';

import { DetailReservationRoomService } from './detail-reservation-room.service';

describe('DetailReservationRoomService', () => {
  let service: DetailReservationRoomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetailReservationRoomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
