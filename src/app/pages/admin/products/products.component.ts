import { Component, OnInit, signal, computed, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { ProductsService } from '@core/services/products.service';
import { KitchenStatusService } from '@core/services/kitchen-status.service';

import { Product } from '@shared/interfaces/product.interface';

import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TooltipModule, TableModule, ButtonModule],
  providers: [DialogService],
  styleUrls: []
})
export class ProductsComponent implements OnInit {
	private dialogService = inject(DialogService);
	private productsService = inject(ProductsService);
	private fb = inject(FormBuilder);
	private kitchenStatusService = inject(KitchenStatusService);

	private _products = signal<Product[]>([]);
	public products = computed(() => this._products());
	public filteredProducts = signal<Product[]>([]);
	private _selectedProduct = signal<Product | null>(null);
	public selectedProduct = computed(() => this._selectedProduct());

	public _isKitchenOpen = signal<boolean>(false);
	public isKitchenOpen = computed(() => this._isKitchenOpen());

	public searchForm: FormGroup;

	public loadingProducts = signal<boolean>(false);

	private ref: DynamicDialogRef | undefined;

	constructor() {
		this.searchForm = this.fb.group({
			query: ['']
		});
	}

	ngOnInit(): void {

		this.getProducts();

		this.searchForm.get('query')?.valueChanges.subscribe((searchTerm) => {
			this.filterProducts(searchTerm);
		});

		this.kitchenStatusService.getKitchenStatus().subscribe(status => {
			this._isKitchenOpen.set(status);
		});
	}

	getProducts() {
		this.loadingProducts.set(true);
		this.productsService.getProducts().subscribe((products) => {
			this._products.set(products);
			this.filteredProducts.set(products);
		});
		this.loadingProducts.set(false);
	}

	filterProducts(searchTerm: string) {
		const filteredProducts = this.products().filter(product =>
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.category.toLowerCase().includes(searchTerm.toLowerCase()) || product.description?.toLowerCase().includes(searchTerm.toLowerCase())
		);
		this.filteredProducts.set(filteredProducts);
	}

	openAddProductModal() {
		this.productsService.selectedProduct.set(null);
		this.productsService.openProductModal();
	}

	openEditProductModal(product: any) {
		this.productsService.selectedProduct.set(product);
		this.productsService.openProductModal();
	}

	closeProductModal() {
		this.productsService.closeProductModal();
	}

	openCategoriesModal() {
		this.productsService.openCategoriesModal();
	}

	toggleKitchenStatus() {
		this.kitchenStatusService.setKitchenStatus(!this.isKitchenOpen());
	}

	setSelectedProduct(product: Product) {
		this._selectedProduct.set(product);
	}

  // Método para organizar los platillos por categoría
	organizeByCategory(items: Product[]): { [key: string]: Product[] } {
	  return items.reduce((acc: { [key: string]: Product[] }, item: Product) => {
		const categoryKey = item.category ? item.category : 'Uncategorized';

		if (!acc[categoryKey]) {
		  acc[categoryKey] = [];
		}
		acc[categoryKey].push(item);
		return acc;
	  }, {});
	}

	pauseProduct(product: Product) {
		this.productsService.pauseProduct(product);
	}

	enableProduct(product: Product) {
		this.productsService.enableProduct(product);
	}
}
