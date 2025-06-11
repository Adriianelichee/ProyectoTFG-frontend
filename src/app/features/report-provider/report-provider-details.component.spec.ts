import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportProviderDetailsComponent } from './report-provider-details.component';

describe('ReportProviderDetailsComponent', () => {
  let component: ReportProviderDetailsComponent;
  let fixture: ComponentFixture<ReportProviderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportProviderDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportProviderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
