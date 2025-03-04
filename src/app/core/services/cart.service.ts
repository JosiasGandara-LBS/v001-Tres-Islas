import { computed, effect, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { collection, collectionData, doc, docData, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Storage } from '@angular/fire/storage';
import { MenuItem } from '../models/menu-item';

@Injectable({
  providedIn: 'root'
})
export class CartService {

	private _firestore = inject(Firestore);
	private _storage = inject(Storage);
	private _collectionMenu = collection(this._firestore, 'menu');

	private cartItemsCount = signal<number>(0);  // Signal que guarda el total de items en el carrito
	private totalPrice = signal<number>(0); // Signal para el totalPrice
	private cartItems = signal<any[]>([]);  // Signal para los items del carrito

	getMenu = toSignal(collectionData(this._collectionMenu, { idField: 'id' }) as Observable<MenuItem[]>, { initialValue: [] });

	constructor() {
		this.cartItems.set(this.getCartItems());
		this.cartItemsCount.set(this.getTotalItems());
		this.totalPrice.set(this.getTotalPrice());
	}

	// Getter público para acceder a cartItems
	get cartItemsValue() {
		return this.cartItems();
	}

	// Método para obtener un item por ID
	getItemById(itemId: string): Observable<any> {
		const itemRef = doc(this._firestore, `menu/${itemId}`);
		return docData(itemRef, { idField: 'id' });
	}

	// Método para obtener el total de items en el carrito
	getTotalItems(): number {
		const cartItems = this.getCartItems();
		return cartItems.reduce((total, item) => total + item.quantity, 0);
	}

	getTotalPrice(): number {
		const cartItems = this.getCartItems();
		return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);  // Calcular el total
		// return cartItems.reduce((total, item) => (total + (item.price * item.quantity) * 1.16), 0);
	}

	// Método para obtener los elementos del carrito desde el localStorage
	getCartItems(): any[] {
		const cart = localStorage.getItem('cart');
		return cart ? JSON.parse(cart) : [];
	}

	getCartItemsToOrder(): { id: string, name: string, quantity: number }[] {
		const cart = JSON.parse(localStorage.getItem('cart') || '[]');
		return cart.map((item : any) => ({
			id: item.id,
			name: item.name,
			quantity: item.quantity,
			price: item.price
		}));
	}

	// Método para guardar el carrito en el localStorage
	saveCartItems(cartItems: any[]): void {
		localStorage.setItem('cart', JSON.stringify(cartItems));
		this.cartItems.set(cartItems);
		this.cartItemsCount.set(this.getTotalItems());
		this.totalPrice.set(this.getTotalPrice());
	}

	// Método para agregar un platillo al carrito
	addToCart(id: string, name: string, description: string, price: number, quantity: number, additionalInstructions: string): void {
		const cartItems = this.cartItemsValue;

		cartItems.push({ id, name, description, price, image: '', quantity: quantity, additionalInstructions: additionalInstructions });
		// Guardar el carrito actualizado
		this.saveCartItems(cartItems);
	}

	// Nueva función que actualiza el carrito con las imágenes
	updateCartItemsWithImage(): void {
		const menuItems = this.getMenu();
		const cartItems = this.cartItemsValue;

		cartItems.forEach((cartItem) => {
			const menuItem = menuItems.find(item => item.id === cartItem.id);
			if (menuItem) cartItem.image = menuItem.image;
		});

		this.saveCartItems(cartItems); // Guardar los cartItems actualizados con las imágenes
	}

	clearCart() {
		localStorage.removeItem('cart');
		this.cartItems.set([]);
  		this.cartItemsCount.set(0);
		this.totalPrice.set(0);
	}

	// Método para incrementar la cantidad de un platillo
	incrementQuantity(id: string): void {
		const cartItems = this.getCartItems();
		const item = cartItems.find(item => item.id === id);

		if (item) {
			item.quantity += 1;
			this.saveCartItems(cartItems);
		}
	}

	// Método para disminuir la cantidad de un platillo
	decrementQuantity(id: string): void {
		const cartItems = this.getCartItems();
		const item = cartItems.find(item => item.id === id);

		if (item) {
			item.quantity = Math.max(0, item.quantity - 1);  // Disminuir, pero no menos que 0
			if (item.quantity === 0) {
				const index = cartItems.indexOf(item); // Eliminar el producto si la cantidad es 0
				if (index > -1) {
					cartItems.splice(index, 1);  // Eliminar el artículo del carrito
				}
			}
			this.saveCartItems(cartItems);
		}
	}

	// Método para obtener el contador de items como Signal
	getCartItemsCount() {
		return computed(() => this.cartItemsCount()); // Devuelve el cartItemsCount como Signal
	}

	getTotalPriceSignal() {
		return computed(() => this.totalPrice());  // Devuelve el totalPrice como Signal
	}
}
