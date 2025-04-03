import { computed, effect, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { collection, collectionData, doc, docData, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Storage } from '@angular/fire/storage';
import { MenuItem } from '../models/menu-item';
import { CartItem } from '../models/cart-item';
import { Promotions2Service } from './promotions2.service';
import { Promotion } from '@shared/interfaces/promotion.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {

	private _firestore = inject(Firestore);
	private _storage = inject(Storage);
	private _collectionMenu = collection(this._firestore, 'menu');
	private promotions2Service = inject(Promotions2Service);

	private cartItemsCount = signal<number>(0);
	private cartItems = signal<any[]>([]);

	private cartItemsSignal = signal<CartItem[]>(this.getCartItems());
  	private promotionsSignal = signal<any[]>([]);

	// Se recalcula automáticamente cuando cambian las promociones o el carrito
	totalPrice = computed(() => {
		const cartItems = this.cartItemsSignal();
		const promotions = this.promotionsSignal();

		let total = 0;
		const promoMap = new Map<string, any>();

		promotions.forEach(promo => {
		  if (promo.enabled) {
			promo.categories.forEach((category: string) => promoMap.set(category, promo));
		  }
		});

		total = cartItems.reduce((acc, item) => {
		  let quantity = item.quantity;
		  let price = item.price;

		  // Aplicar promociones si existen
		  const promo = promoMap.get(item.category);
		  if (promo) quantity = this.applyPromotion(promo, quantity, price);

		  return acc + (price * quantity);
		}, 0);

		return total;
	});

	getMenu = toSignal(collectionData(this._collectionMenu, { idField: 'id' }) as Observable<MenuItem[]>, { initialValue: [] });

	constructor() {
		this.cartItems.set(this.getCartItems());
		this.cartItemsCount.set(this.getTotalItems());

		// Sincroniza el carrito con el localStorage al iniciar
		this.cartItemsSignal.set(this.getCartItems());

		// Suscribirse a las promociones activas y actualizar el Signal sin usar `effect`
		this.promotions2Service.promotions$.subscribe(promotions => {
			this.promotionsSignal.set(promotions);
		});
	}

	// Getter público para acceder a cartItems
	get cartItemsValue() {
		return this.cartItems();
	}

	// Devuelve el cartItemsCount como Signal
	getCartItemsCount() {
		return computed(() => this.cartItemsCount());
	}

	// Devuelve el totalPrice como Signal
	getTotalPriceSignal() {
		return this.totalPrice;
	}

	getPromotionsSignal() {
		return this.promotionsSignal;
	}

	// Método para obtener un item por ID
	getItemById(itemID: string): Observable<any> {
		const itemRef = doc(this._firestore, `menu/${itemID}`);
		return docData(itemRef, { idField: 'id' });
	}

	// Método para obtener el total de items en el carrito
	getTotalItems(): number {
		const cartItems = this.getCartItems();
		return cartItems.reduce((total, item) => total + item.quantity, 0);
	}

	// Obtener el total de la compra con descuento aplicado
	getTotalPrice(): number {
		const cartItems = this.getCartItems();
		let total = 0;

		this.promotions2Service.promotions$.subscribe(promotions => {
		  	// Crear un mapa de promociones por categoría para acceso rápido
		  	const promoMap = new Map<string, any>();

			promotions.forEach(promo => {
				if (promo.enabled) promo.categories.forEach((category: string) => promoMap.set(category, promo));
			});

			// Reducir el total aplicando las promociones activas
			total = cartItems.reduce((acc, item) => {

				// Parametros de item
				let quantity = item.quantity;
				let price = item.price;

				// Si hay una promo para la categoría del producto, aplicarla
				const promo = promoMap.get(item.category);
				if (promo) quantity = this.applyPromotion(promo, quantity, price);

				return acc + (price * quantity);
			}, 0);

			console.log("Total con promociones aplicadas:", total);
		});

		return total;
	}

	applyPromotion(promo: any, quantity: number, price: number): number {
		switch (promo.id) {

			case "3X2TYT3A5": // Promoción 3x2 de testing
				const freeItems = Math.floor(quantity / 3);
				quantity -= freeItems; // Se descuentan los productos gratis
				break;

			case "TEST50OFF": // 50% de descuento en la cantidad
				quantity = Math.ceil(quantity * 0.5);
				break;

			case "TEST2X1": // 2x1 (Cada dos productos, uno es gratis)
				quantity -= Math.floor(quantity / 2);
				break;

			// Agregar más reglas de promociones aquí en el futuro...

			default:
				console.log(`No hay reglas definidas para la promo: ${promo.id}`);
		}

		return quantity;
	}

	// Método para obtener los elementos del carrito desde el localStorage
	getCartItems(): CartItem[] {
		const cart = localStorage.getItem('cart');
		return cart ? JSON.parse(cart) : [];
	}

	getCartItemById(cartItemID: string): CartItem | undefined {
		const cartItems = this.getCartItems();
		return cartItems.find(item => item.id === cartItemID);
	}

	getCartItemsToOrder(): { id: string, name: string, quantity: number }[] {
		const cart = JSON.parse(localStorage.getItem('cart') || '[]');
		return cart.map((item : any) => ({
			id: item.id,
			name: item.name,
			quantity: item.quantity,
			category: item.category,
			price: item.price,
			additionalInstructions: item.additionalInstructions
		}));
	}

	// Método para obtener la cantidad de un item en el carrito
    getQuantity(itemId: string): number {
        const cartItems = this.getCartItems();
        return cartItems.filter(item => item.id === itemId).reduce((total, item) => total + item.quantity, 0);
    }

	// Método para guardar el carrito en el localStorage
	saveCartItems(cartItems: CartItem[]): void {
		localStorage.setItem('cart', JSON.stringify(cartItems));
		this.cartItems.set(cartItems);
		this.cartItemsSignal.set(cartItems);
		this.cartItemsCount.set(this.getTotalItems());
	}

	// Método para agregar un platillo al carrito
	addToCart(id: string, name: string, description: string, category: string, price: number, quantity: number, additionalInstructions: string): void {
        const cartItems = [...this.cartItems()];
		cartItems.push ({ id, name, description, category, price, image: '', quantity, additionalInstructions});

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

	updateCartItem(cartItem: CartItem): void {
		const cart = this.getCartItems();
		const index = cart.findIndex(item => item.id === cartItem.id);

		if (index !== -1) {
			cart[index] = { ...cart[index], ...cartItem };
			this.saveCartItems(cart);
		}
	}

	deleteCartItem(cartItemID: string): void {
		const cart = this.getCartItems();
		const index = cart.findIndex(item => item.id === cartItemID);

		if (index !== -1) {
			cart.splice(index, 1);
			this.saveCartItems(cart);
		}
	}

	clearCart() {
		localStorage.removeItem('cart');
		this.cartItems.set([]);
  		this.cartItemsCount.set(0);
	}

	// Método para incrementar la cantidad de un platillo
	incrementQuantity(cartItemID: string): void {
		const cartItems = this.getCartItems();
		const item = cartItems.find(item => item.id === cartItemID);

		if (item) {
			item.quantity += 1;
			this.saveCartItems(cartItems);
		}
	}

	// Método para disminuir la cantidad de un platillo
	decrementQuantity(cartItemID: string): void {
		const cartItems = this.getCartItems();
		const item = cartItems.find(item => item.id === cartItemID);

		if (item) {
			item.quantity = Math.max(0, item.quantity - 1);
			if (item.quantity === 0) {
				const index = cartItems.indexOf(item);
				if (index > -1) {
					cartItems.splice(index, 1);
				}
			}
			this.saveCartItems(cartItems);
		}
	}
}
