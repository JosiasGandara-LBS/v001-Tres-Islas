import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProductsService } from '@core/services/products.service';
import Swal from 'sweetalert2';

@Component({
	selector: 'app-category-modal',
	templateUrl: './category-modal.component.html',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	styleUrls: []
})
export class CategoryModalComponent implements OnInit {
	categoryForm: FormGroup;
	editCategoryForm: FormGroup;
	editingCategoryId: string | null = null;

	public categories: any[] = [];

	private productsService = inject(ProductsService);

	constructor(
		private fb: FormBuilder,
		public ref: DynamicDialogRef
	) {
		this.categoryForm = this.fb.group({
			name: ['', Validators.required]
		});
		this.editCategoryForm = this.fb.group({
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

	editCategory(category: any) {
		this.editingCategoryId = category.id;
		this.editCategoryForm.patchValue({ name: category.name });
	}

	updateCategory() {
		if (this.editCategoryForm.valid && this.editingCategoryId) {
			this.productsService.updateCategory(this.editingCategoryId, this.editCategoryForm.value)
			this.editingCategoryId = null;
		}
	}

	deleteCategory(category: any) {
		Swal.fire({
			title: '¿Estás seguro?',
			text: "¡No podrás revertir esto!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Sí, eliminarlo!'
		}).then((result) => {
			if (result.isConfirmed) {
				this.productsService.deleteCategory(category.id).then(() => {
					Swal.fire(
						'Eliminado!',
						'La categoría ha sido eliminada.',
						'success'
					);
				});
			}
		});
	}
}
