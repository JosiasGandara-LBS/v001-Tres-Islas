import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { OrdersService } from '@core/services/orders.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-orders-client-detail',
  standalone: true,
  imports: [CardModule, ButtonModule, CommonModule],
  templateUrl: './orders-client-detail.component.html',
  styleUrl: './orders-client-detail.component.scss'
})
export class OrdersClientDetailComponent {
  // private ordersService = inject(OrdersService);
  // private route = inject(ActivatedRoute);
  // private router = inject(Router);

  // private _order = signal<any>(null);
  // public order = computed(() => this._order());
  // private _orderItems = signal<any[]>([]);
  // public orderItems = computed(() => this._orderItems());

  // constructor() {
  //   const orderId = this.route.snapshot.params['id'];
  //   console.log(orderId);
  //   try {
  //     this.ordersService.getOrderById(orderId).subscribe((order) => {
  //       console.log(order);
  //       this._order.set(order);
  //       this.ordersService.getOrderItems(orderId).subscribe((orderitems) => {
  //         this._orderItems.set(orderitems);
  //       });
  //       if (!this.order) {
  //         this.router.navigateByUrl('/orders-client');
  //       }
  //     });
  //   } catch (error) {
  //     Swal.fire('Error', 'No se pudo cargar la orden', 'error');
  //     this.router.navigateByUrl('/orders-client');
  //   }
  // }

  // closeDetail() {
  //   this.router.navigateByUrl('/orders-client')
  // }
}
