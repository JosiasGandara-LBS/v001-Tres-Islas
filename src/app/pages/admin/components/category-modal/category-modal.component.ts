import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProductsService } from '@core/services/products.service';

@Component({
	selector: 'app-category-modal',
	templateUrl: './category-modal.component.html',
	standalone: true,
	imports: [CommonModule,ReactiveFormsModule],
	styleUrls: []
})
export class CategoryModalComponent implements OnInit {
	categoryForm: FormGroup;

	public categories: any[] = [];

	private productsService = inject(ProductsService)

	constructor(
		private fb: FormBuilder,
		public ref: DynamicDialogRef
	) {
		this.categoryForm = this.fb.group({
			name: ['', Validators.required]
		});
	}

	ngOnInit() {
		this.getCategories();
	}

	getCategories() {
		this.productsService.getCategories().subscribe((categories) => this.categories = categories);
	}

	saveCategory() {
		if (this.categoryForm.valid) {
			this.ref.close(this.categoryForm.value);

			this.productsService.addCategory(this.categoryForm.value);
		}
	}
}
