import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { OrdersService } from '@core/services/orders.service';
import { KeysLengthPipe } from '../../shared/pipes/keys-length.pipe';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { OrdersComponent } from './components/orders/orders.component';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';

@Component({
	selector: 'app-orders-waiter',
	standalone: true,
	imports: [CommonModule, RouterLink, OrdersComponent],
	templateUrl: './orders-waiter.component.html',
	styleUrl: './orders-waiter.component.scss',
})
export class OrdersWaiterComponent {

	numberStageOrder : number = 1;

	showModal: boolean = false;
	selectedOrder : any = null;

	constructor(private _ordersService : OrdersService) {}

}
