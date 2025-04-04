import { computed, effect, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { collection, collectionData, doc, docData, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Storage } from '@angular/fire/storage';
import { MenuItem } from '../models/menu-item';
import { CartItem } from '../models/cart-item';
import { Promotions2Service } from './promotions2.service';
import { Promotion } from '@shared/interfaces/promotion.interface';
import Swal from 'sweetalert2';

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

	private arePromotionsActive = signal<boolean>(false);

	cartItemsWithDiscount = signal<CartItem[]>([]);

	modalVisible: WritableSignal<boolean> = signal(false);

	// Se recalcula automáticamente cuando cambian las promociones o el carrito
	totalPrice = computed(() => {
		const promotions = this.promotionsSignal();

		let total = 0;
		const promoMap = new Map<string, any>();

		promotions.forEach(promo => {
		  if (promo.enabled) {
			promo.categories.forEach((category: string) => promoMap.set(category, promo));
		  }
		});

		total = this.cartItemsWithDiscount().reduce((acc, item) => {
			let quantity = item.quantity;
			let price = item.price;
			let discount = item.discounted || 0;

			return acc + ((price * quantity) - discount);
		},0);

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

		effect(() => {
			const cartItems = this.cartItems();
			const promotions = this.promotionsSignal();

			if (!promotions.length) return;

			const hasActivePromotions = cartItems.some(cartItem =>
				promotions.some(promo =>
					promo.enabled && promo.categories.includes(cartItem.category)
				)
			);

			const hasDiscountWithoutActivePromotions = cartItems.some(cartItem =>
			  	cartItem.discounted > 0 && !hasActivePromotions
			);

			if (hasDiscountWithoutActivePromotions) {
			  	this.modalVisible.set(true);
			}

		}, { allowSignalWrites: true });

		effect(() => {
			const cartItems = this.cartItems();
			cartItems.forEach(cartItem => {
				cartItem.discounted = 0; // Reiniciar el descuento
			});

			const cartItemsWithPromotions: CartItem[] = (cartItems.filter(cartItem => this.hasPromotion(cartItem))).sort((a: CartItem, b: CartItem) => a.price - b.price);

			if (cartItemsWithPromotions.length > 0) {

				// Obtener la cantidad de items que se van a descontar
				const qtyItemsWithPromotions: number = cartItemsWithPromotions.reduce((acc, cartItem) => {
					return acc + cartItem.quantity;
				}, 0);

				const qtyItemsDiscounted: number = Math.floor( qtyItemsWithPromotions / 3);

				for(let i = 0; i < qtyItemsDiscounted; i++) { // Por la cantidad de items descontados (3x2)
					for (let j = 0 ; j < cartItemsWithPromotions.length; j++) { // Iterar los items en los que aplica la promo de menor precio a mayor
						const cartItem = cartItemsWithPromotions[j];
						if ((cartItem.quantity * cartItem.price) > (cartItem.discounted || 0)) { // Si el precio del item es mayor al descuento
							cartItemsWithPromotions[j].discounted = (cartItem.discounted || 0) + cartItem.price; // Se le suma el precio del item al descuento (Se descontó un item)
							break;
						}
					}
				}
			}
			const finalCart = cartItems.map(cartItem => {
				const discountedItem = cartItemsWithPromotions.find(item => item.id === cartItem.id);
				if (discountedItem) {
					cartItem.discounted = discountedItem.discounted;
				}
				return cartItem;
			});
			this.cartItemsWithDiscount.set(finalCart);
		}, {allowSignalWrites: true});
	}

	// Método para obtener si el producto tiene promocion
	hasPromotion(cartItem: any): boolean {
		return this.promotionsSignal().some(promo =>
			promo.enabled && promo.categories.includes(cartItem.category)
		);
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
				let discount = item.discounted || 0;

				// Si hay una promo para la categoría del producto, aplicarla -- JOSIAS GANDARA
				// const promo = promoMap.get(item.category);
				// if (promo) quantity = this.applyPromotion(promo, quantity, price);

				return acc + ((price * quantity) - discount);
			}, 0);
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
			discount: item.discount || 0,
			additionalInstructions: item.additionalInstructions
		}));
	}

	// Método para obtener la cantidad de un item en el carrito
    getQuantity(itemId: string): number {
        const cartItems = this.getCartItems();
        return cartItems.filter(item => item.id === itemId).reduce((total, item) => total + item.quantity, 0);
    }

	//Método para ver si ya existe alguna instrución adicionañ
	getAdditionalInstructionsById(itemId: string): string {
		const cartItems = this.getCartItems();
		const item = cartItems.find(cartItem => cartItem.id === itemId);
		return item ? item.additionalInstructions : '';
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
		const existingItem = cartItems.find(item => item.id === id);

		if (existingItem) {
			// Si existe, incrementar la cantidad y actualizar el comentario o instrucciones adicionales
			existingItem.quantity += quantity;
			existingItem.additionalInstructions = additionalInstructions;  // Aquí se actualiza el comentario
		} else {
			// Si no existe, agregar el platillo al carrito
			cartItems.push({ id, name, description, category, price, image: '', quantity, additionalInstructions , discount: 0});
		}

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
