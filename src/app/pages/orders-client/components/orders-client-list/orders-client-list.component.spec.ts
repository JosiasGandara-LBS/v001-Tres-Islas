import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersClientListComponent } from './orders-client-list.component';

describe('OrdersClientListComponent', () => {
  let component: OrdersClientListComponent;
  let fixture: ComponentFixture<OrdersClientListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersClientListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrdersClientListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
