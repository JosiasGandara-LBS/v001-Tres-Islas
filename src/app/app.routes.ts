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
		path: 'login',
		loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
		canActivate: [authGuard],
	},
	{
		path: 'orders-client',
		loadComponent: () => import('./pages/orders-client/orders-client.component').then(m => m.OrdersClientComponent),
		children: [
			{
				path: '', pathMatch: 'full',
				loadComponent: () => import('./pages/orders-client/components/orders-client-list/orders-client-list.component').then(m => m.OrdersClientListComponent)
			},
			{
				path:':id',
				loadComponent: () => import('./pages/orders-client/components/orders-client-detail/orders-client-detail.component').then(m => m.OrdersClientDetailComponent)
			},
		]
	},
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
		path: 'admin', component: AdminComponent,
		canActivate: [cashierGuard],
		children: [
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
				path: '', redirectTo: 'products', pathMatch: 'full'
			},
			{
				path: '**', redirectTo: 'products', pathMatch: 'full'
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
