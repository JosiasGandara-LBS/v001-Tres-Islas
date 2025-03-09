import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { OrdersClientListComponent } from './components/orders-client-list/orders-client-list.component';
import { OrdersClientDetailComponent } from './components/orders-client-detail/orders-client-detail.component';
import { NavbarComponent } from '../home/components/navbar/navbar.component';

@Component({
  selector: 'app-orders-client',
  standalone: true,
  imports: [RouterModule, NavbarComponent],
  templateUrl: './orders-client.component.html',
  styleUrl: './orders-client.component.scss'
})
export class OrdersClientComponent {

}

