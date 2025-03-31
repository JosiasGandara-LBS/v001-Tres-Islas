import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../../core/services/cart.service';
import { KitchenStatusService } from '@core/services/kitchen-status.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  cartItemsCount = inject(CartService).getCartItemsCount();
  kitchenStatusService = inject(KitchenStatusService);
  isKitchenOpen = computed(() => this.kitchenStatusService.isKitchenOpen());

  constructor(private router: Router) {}

  goToOrders() {
    if (this.isKitchenOpen()) {
      if (this.cartItemsCount() > 0) this.router.navigate(['/shopping-cart']);
    }
  }
}