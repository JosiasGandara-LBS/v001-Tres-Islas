import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../core/services/cart.service';
import { MenuItem } from '../../../../core/models/menu-item';

@Component({
  selector: 'app-modal-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-item.component.html',
  styleUrl: './modal-item.component.scss'
})
export class ModalItemComponent implements OnInit {

	private cartService = inject(CartService);

	@Input() itemId !: string;
	@Output() cerrar = new EventEmitter<void>();

  	isFadingOut = false;

	cartItems: any[] = [];

	item !: MenuItem;
	quantity : number = 1;
	additionalInstructions : string = '';

	ngOnInit(): void {
		if (this.itemId) {
			this.cartService.getItemById(this.itemId).subscribe((data) => {
			  this.item = data;
			});
		}
	}

	returnToMenu() {
		this.isFadingOut = true;
		setTimeout(() => this.cerrar.emit(), 400);
	}

	// Llamar a la función de incrementar cantidad
	incrementQuantity(): void {
		this.quantity++;
	}

	// Llamar a la función de decrementar cantidad
	decrementQuantity(): void {
		if(this.quantity > 1) this.quantity--;
	}

	// Método para agregar al carrito
	addToCart(item: MenuItem, quantity: number): void {
		this.cartService.addToCart(item.id, item.name, item.description, item.price, this.quantity, this.additionalInstructions);
		this.returnToMenu();
	}

}
