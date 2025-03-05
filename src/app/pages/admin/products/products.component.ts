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

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [DialogService],
  styleUrls: []
})
export class ProductsComponent implements OnInit {
	private dialogService = inject(DialogService);
	private productsService = inject(ProductsService);
	private fb = inject(FormBuilder);

	private _products = signal<Product[]>([]);
	public products = computed(() => this._products());
	private _selectedProduct = signal<Product | null>(null);
	public selectedProduct = computed(() => this._selectedProduct());

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
		});

		this.searchForm.get('searchTerm')?.valueChanges.subscribe((searchTerm) => {
			this.filterProducts(searchTerm);
		});
	}

	filterProducts(searchTerm: string) {
		const filteredProducts = this._products().filter(product =>
			product.name.toLowerCase().includes(searchTerm.toLowerCase())
		);
		this._products.set(filteredProducts);
	}

	isKitchenOpen = true;

	openAddProductModal() {
		this.productsService.selectedProduct.set(null);
		this.ref = this.dialogService.open(ProductModalComponent, {
			header: 'Agregar producto',
			modal: true,
			keepInViewport: true,
			width: '70%',
			height: '80%',
			contentStyle: { overflow: 'auto' },
		});
	}

	openEditProductModal(product: any) {
		this.productsService.selectedProduct.set(product);
		this.ref = this.dialogService.open(ProductModalComponent, {
			header: 'Editar producto',
			modal: true,
			keepInViewport: true,
			width: '70%',
			height: '80%',
			contentStyle: { overflow: 'auto' },
			
		});
	}

	openCategoriesModal() {
		this.ref = this.dialogService.open(CategoryModalComponent, {
			header: 'Categorías',
			modal: true,
			keepInViewport: true,
			width: '50%',
			height: '50%',
			contentStyle: { overflow: 'auto' },
		});
	}

	toggleKitchenStatus() {
		this.isKitchenOpen = !this.isKitchenOpen;
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
