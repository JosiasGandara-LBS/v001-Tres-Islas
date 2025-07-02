import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { OrdersComponent } from '../../orders-waiter/components/orders/orders.component';
import { CommonModule } from '@angular/common';
import { OrdersService } from '@core/services/orders.service';
import { DividerModule } from 'primeng/divider';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-orders-history',
  standalone: true,
  imports: [OrdersComponent, CommonModule, DividerModule],
  templateUrl: './orders-history.component.html',
  styleUrl: './orders-history.component.scss'
})
export class OrdersHistoryComponent implements OnInit, OnDestroy {
  private ordersService = inject(OrdersService);

  private _orders = signal<any[]>([]);
  public orders = computed(() => this._orders());
  public selectedOrder = signal<number>(3); // default to 'Entregado'
  public sortDirection = signal<'asc' | 'desc'>('desc');

  public filteredOrders = computed(() => {
    const ordersArr = this.orders();
    const orders = ordersArr[this.selectedOrder()] || [];
    return [...orders].sort((a, b) => {
      const parseDate = (str: string) => {
        if (!str) return 0;
        const [datePart, timePart] = str.split(', ');
        if (!datePart || !timePart) return 0;
        const [day, month, year] = datePart.split('/').map(Number);
        let [time, meridian] = timePart.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (meridian?.toLowerCase().includes('p') && hours < 12) hours += 12;
        if (meridian?.toLowerCase().includes('a') && hours === 12) hours = 0;
        const fullYear = year < 100 ? 2000 + year : year;
        return new Date(fullYear, month - 1, day, hours, minutes).getTime();
      };
      const dateA = parseDate(a.createdDate);
      const dateB = parseDate(b.createdDate);
      return this.sortDirection() === 'asc' ? dateA - dateB : dateB - dateA;
    });
  });

  statuses = [
    { n: 1, text: 'Recibido', color: 'blue-500', classes: 'border-blue-500 shadow-blue-500/50', icon: 'pi pi-inbox', hasChanges: false },
    { n: 2, text: 'Preparando', color: 'yellow-600', classes: 'border-yellow-600 shadow-yellow-600/50', icon: 'pi pi-clock', hasChanges: false },
    { n: 0, text: 'Cancelado', color: 'red-500', classes: 'border-red-500 shadow-red-500/50', icon: 'pi pi-ban', hasChanges: false },
    { n: 3, text: 'Entregado', color: 'green-800', classes: 'border-green-800 shadow-green-800/50', icon: 'pi pi-check', hasChanges: false }
  ];

  subscriptions: any[] = [];

  ngOnInit(): void {
    this.statuses.forEach(status => {
      this.getOrdersForStatus(status.n);
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe && s.unsubscribe());
  }

  getOrdersForStatus(status: number): void {
    const sub = this.ordersService.getOrderHistoryByState(status).subscribe((data: any) => {
      const filteredData = data.filter((order: any) => {
        return !(order.paymentMethod === "card" && order.pendingPayment === true);
      });
      const updatedOrders = [...this._orders()];
      updatedOrders[status] = filteredData;
      this._orders.set(updatedOrders);
      if (filteredData.filter((order: any) => order.isChecked === 0).length > 0) {
        this.statuses.find(s => s.n === status)!.hasChanges = true;
      } else {
        this.statuses.find(s => s.n === status)!.hasChanges = false;
      }
    });
    this.subscriptions.push(sub);
  }

  changeTab(status: number): void {
    this.selectedOrder.set(status);
  }

  setSortDirection(direction: 'asc' | 'desc') {
    this.sortDirection.set(direction);
  }

  exportToExcel(): void {
	Swal.fire({
		title: 'Exportar órdenes',
		text: '¿Deseas exportar el historial de ordenes a Excel?',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonText: 'Sí, exportar',
		cancelButtonText: 'Cancelar'
	}).then((result) => {
		if (result.isConfirmed) {
			this.ordersService.exportOrdersToExcel(true);
		}
	});
  }
}
