import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersClientDetailComponent } from './orders-client-detail.component';

describe('OrdersClientDetailComponent', () => {
  let component: OrdersClientDetailComponent;
  let fixture: ComponentFixture<OrdersClientDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersClientDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrdersClientDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
