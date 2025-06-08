import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkstationListComponent } from './workstation-list.component';

describe('WorkstationListComponent', () => {
  let component: WorkstationListComponent;
  let fixture: ComponentFixture<WorkstationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkstationListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkstationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
