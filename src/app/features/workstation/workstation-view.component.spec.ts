import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkstationViewComponent } from './workstation-view.component';

describe('WorkstationViewComponent', () => {
  let component: WorkstationViewComponent;
  let fixture: ComponentFixture<WorkstationViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkstationViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkstationViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
