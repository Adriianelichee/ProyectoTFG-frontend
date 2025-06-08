import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CleaningFormComponent } from './cleaning-form.component';

describe('CleaningFormComponent', () => {
  let component: CleaningFormComponent;
  let fixture: ComponentFixture<CleaningFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CleaningFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CleaningFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
