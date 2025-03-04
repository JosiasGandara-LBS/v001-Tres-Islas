import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: 'home',
		loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
	},
	{
		path: 'shopping-cart',
		loadComponent: () => import('./pages/shopping-cart/shopping-cart.component').then(m => m.ShoppingCartComponent)
	},
	{
		path: 'checkout',
		loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent)
	},
	// Rutas predefinidas
	{
		path: '', redirectTo: 'home', pathMatch: 'full'
	},
	{
		path: '**', redirectTo: 'home', pathMatch: 'full'
	}
];
