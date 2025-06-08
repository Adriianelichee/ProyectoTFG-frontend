import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchasedServicesDetailComponent } from './purchased-services-detail.component';

describe('PurchasedServicesDetailComponent', () => {
  let component: PurchasedServicesDetailComponent;
  let fixture: ComponentFixture<PurchasedServicesDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchasedServicesDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchasedServicesDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
