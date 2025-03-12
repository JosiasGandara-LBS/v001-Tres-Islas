import { Component, effect, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { OrdersClientListComponent } from './components/orders-client-list/orders-client-list.component';
import { NavbarComponent } from '../home/components/navbar/navbar.component';
import { ButtonModule } from 'primeng/button';
import { OrdersService } from '@core/services/orders.service';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { CommonModule } from '@angular/common';
import { OrdersClientService } from '@core/services/orders-client.service';

@Component({
  selector: 'app-orders-client',
  standalone: true,
  imports: [CommonModule, RouterModule, OrdersClientListComponent, ButtonModule, TruncatePipe],
  templateUrl: './orders-client.component.html',
  styleUrl: './orders-client.component.scss'
})
export class OrdersClientComponent {

	getOrders: any[] = [];

	title = 'Tus pedidos'

	constructor(private router: Router, private ordersClientService: OrdersClientService) {
		effect(() => {
			this.getOrders = this.ordersClientService.orders();
		});
	}

	goToHome() { this.router.navigate(['/home']) }
}

