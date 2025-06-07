import { TestBed } from '@angular/core/testing';

import { PurchasedServiceService } from './purchased-service.service';

describe('PurchasedServiceService', () => {
  let service: PurchasedServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PurchasedServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
