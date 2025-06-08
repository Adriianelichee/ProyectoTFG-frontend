import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkstationDetailsComponent } from './workstation-details.component';

describe('WorkstationDetailsComponent', () => {
  let component: WorkstationDetailsComponent;
  let fixture: ComponentFixture<WorkstationDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkstationDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkstationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
