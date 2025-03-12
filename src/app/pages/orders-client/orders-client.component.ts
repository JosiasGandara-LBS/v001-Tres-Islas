import { Component, effect, inject, Injector, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../home/components/navbar/navbar.component';
import { ButtonModule } from 'primeng/button';
import { OrdersService } from '@core/services/orders.service';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { CommonModule } from '@angular/common';
import { OrdersClientService } from '@core/services/orders-client.service';
import { OrdersClientDetailComponent } from './components/orders-client-detail/orders-client-detail.component';

@Component({
  selector: 'app-orders-client',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TruncatePipe],
  templateUrl: './orders-client.component.html',
  styleUrl: './orders-client.component.scss'
})
export class OrdersClientComponent {

	getOrders: any[] = [];

	@ViewChild('orderClientDetail', { read: ViewContainerRef }) container!: ViewContainerRef;

	title = 'Tus pedidos'

	constructor(private router: Router, private ordersClientService: OrdersClientService, private injector : Injector) {
		effect(() => {
			this.getOrders = this.ordersClientService.orders();
		});
	}

	insertarComponente(orderID: string){
		const componentRef = this.container.createComponent(OrdersClientDetailComponent, { injector: this.injector });
		componentRef.instance.orderID = orderID;
		componentRef.instance.cerrar.subscribe(() => componentRef?.destroy());
	}

	goToHome() { this.router.navigate(['/home']) }
}

