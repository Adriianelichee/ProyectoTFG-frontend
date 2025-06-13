import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchasedViewComponent } from './purchased-view.component';

describe('PurchasedViewComponent', () => {
  let component: PurchasedViewComponent;
  let fixture: ComponentFixture<PurchasedViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchasedViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchasedViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
