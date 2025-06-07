import { TestBed } from '@angular/core/testing';

import { ReportProviderService } from './report-provider.service';

describe('ReportProviderService', () => {
  let service: ReportProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
