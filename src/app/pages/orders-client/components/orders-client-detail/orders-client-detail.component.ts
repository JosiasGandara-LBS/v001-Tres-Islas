import { Component, computed, EventEmitter, inject, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { OrdersService } from '@core/services/orders.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { MenuItem } from '@core/models/menu-item';
import { Subscription } from 'rxjs';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';

@Component({
  selector: 'app-orders-client-detail',
  standalone: true,
  imports: [CardModule, ButtonModule, CommonModule, TruncatePipe],
  templateUrl: './orders-client-detail.component.html',
  styleUrl: './orders-client-detail.component.scss'
})
export class OrdersClientDetailComponent implements OnInit {

	isFadingOut: boolean = false;

	@Input() orderID !: string;
	@Output() cerrar = new EventEmitter<void>();

	order !: any;

	constructor(private ordersService : OrdersService) {}

	async ngOnInit() {
		if(this.orderID) {
			this.order = await this.ordersService.getOrderById(this.orderID);
		}
	}

	returnToOrdersClient() {
		this.isFadingOut = true;
		setTimeout(() => this.cerrar.emit(), 400);
	}
}
