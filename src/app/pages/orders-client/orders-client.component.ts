import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { OrdersClientListComponent } from './components/orders-client-list/orders-client-list.component';
import { NavbarComponent } from '../home/components/navbar/navbar.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-orders-client',
  standalone: true,
  imports: [RouterModule, NavbarComponent, OrdersClientListComponent, ButtonModule],
  templateUrl: './orders-client.component.html',
  styleUrl: './orders-client.component.scss'
})
export class OrdersClientComponent {

}

