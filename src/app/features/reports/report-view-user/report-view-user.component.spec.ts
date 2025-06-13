import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportViewUserComponent } from './report-view-user.component';

describe('ReportViewUserComponent', () => {
  let component: ReportViewUserComponent;
  let fixture: ComponentFixture<ReportViewUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportViewUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportViewUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
