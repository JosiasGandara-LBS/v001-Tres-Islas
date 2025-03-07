import { ref } from 'firebase/storage';
import { ProductModalComponent } from './../components/product-modal/product-modal.component';
import { Component, OnInit, signal, computed, Inject, inject } from '@angular/core';
import { ProductsService } from '@core/services/products.service'; // Adjust the path as necessary
import { CommonModule } from '@angular/common';
import { Product } from '@shared/interfaces/product.interface'; // Adjust the path as necessary
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CategoryModalComponent } from '../components/category-modal/category-modal.component';
import { TooltipModule } from 'primeng/tooltip';
import { KitchenStatusService } from '@core/services/kitchen-status.service'; // Import the service


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TooltipModule],
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

	private ref: DynamicDialogRef | undefined;

	constructor() {
		this.searchForm = this.fb.group({
			query: ['']
		});
	}

	ngOnInit(): void {
		this.productsService.getProducts().subscribe((products) => {
			this._products.set(products);
			this.filteredProducts.set(products);
		});

		this.searchForm.get('query')?.valueChanges.subscribe((searchTerm) => {
			this.filterProducts(searchTerm);
		});

		this.kitchenStatusService.getKitchenStatus().subscribe(status => {
			this._isKitchenOpen.set(status);
		});
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
}
