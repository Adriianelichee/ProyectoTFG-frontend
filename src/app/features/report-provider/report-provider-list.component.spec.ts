import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportProviderListComponent } from './report-provider-list.component';

describe('ReportProviderListComponent', () => {
  let component: ReportProviderListComponent;
  let fixture: ComponentFixture<ReportProviderListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportProviderListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportProviderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
