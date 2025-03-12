import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

	cartItemsCount = inject(CartService).getCartItemsCount();

	constructor(private router : Router){}

	goToOrders() {
		if(this.cartItemsCount() > 0) this.router.navigate(['/shopping-cart'])
	}

}
