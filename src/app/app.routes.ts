import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { waiterGuard } from '@core/guards/waiter.guard';
import { AdminComponent } from './pages/admin/admin.component';
import { cashierGuard } from '@core/guards/cashier.guard';
import { adminGuard } from '@core/guards/admin.guard';
import { OrdersWaiterComponent } from './pages/orders-waiter/orders-waiter.component';

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
	{
		path: 'confirm-payment',
		loadComponent: () => import('./pages/checkout/components/waiting-confirm-payment/waiting-confirm-payment.component').then(m => m.WaitingConfirmPaymentComponent)
	},
	{
		path: 'login',
		loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
		canActivate: [authGuard],
	},
	{
		path: 'orders-client',
		loadComponent: () => import('./pages/orders-client/orders-client.component').then(m => m.OrdersClientComponent),
	},
	{
		path: 'admin', component: AdminComponent,
		canActivate: [cashierGuard],
		children: [
			{
				path: 'orders-waiter', component: OrdersWaiterComponent,
				canActivate: [waiterGuard],
				children: [
					{
						path: '', redirectTo: 'orders-waiter', pathMatch: 'full'
					}
				]
			},
			{
				path: 'products',
				loadComponent: () => import('./pages/admin/products/products.component').then(m => m.ProductsComponent),
			},
			{
				path: 'employees',
				canActivate: [adminGuard],
				loadComponent: () => import('./pages/admin/employees/employees.component').then(m => m.EmployeesComponent),
			},
			{
				path: 'history',
				canActivate: [adminGuard],
				loadComponent: () => import('./pages/admin/orders-history/orders-history.component').then(m => m.OrdersHistoryComponent),
			},
			{
				path: 'configs',
				canActivate: [adminGuard],
				loadComponent: () => import('./pages/admin/configs/configs.component').then(m => m.ConfigsComponent),
			},
			{
				path: '', redirectTo: 'orders-waiter', pathMatch: 'full'
			},
			{
				path: '**', redirectTo: 'orders-waiter', pathMatch: 'full'
			}
		]

	},
	// Rutas predefinidas
	{
		path: '', redirectTo: 'home', pathMatch: 'full'
	},
	{
		path: '**', redirectTo: 'home', pathMatch: 'full'
	}
];
