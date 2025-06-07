import { TestBed } from '@angular/core/testing';

import { DetailReservationWorkstationService } from './detail-reservation-workstation.service';

describe('DetailReservationWorkstationService', () => {
  let service: DetailReservationWorkstationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetailReservationWorkstationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
