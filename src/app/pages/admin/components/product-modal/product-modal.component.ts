import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '@shared/interfaces/product.interface';
import { ProductsService } from '@core/services/products.service';
import { DialogModule } from 'primeng/dialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FileUploadModule } from 'primeng/fileupload';
import { CategoryModalComponent } from '../category-modal/category-modal.component';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'products-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, InputSwitchModule, FileUploadModule, DropdownModule, InputNumberModule, InputTextareaModule, InputTextModule],	
  templateUrl: './product-modal.component.html',
  styleUrl: './product-modal.component.scss',
  providers: [MessageService]
})
export class ProductModalComponent implements OnInit {

	private productsService = inject(ProductsService)
	private fb = inject(FormBuilder)
	private messageService = inject(MessageService)

	categories: any[] = [];
	imagePreview: string | ArrayBuffer | null = null;
	public product = this.productsService.selectedProduct() ?? { id: '', name: '', price: 0, description: '', available: true, category: '', image: '' };

	ngOnInit() {
		if (this.product) {
			this.productForm.patchValue({
				...this.product,
				price: this.product?.price,
				available: this.product?.available
			});
			
		}
		console.log(this.productForm.get('image')?.value);
		this.fetchCategories();
	}

	public productForm = this.fb.group({
		name: [this.product?.name ?? '', [Validators.required, Validators.minLength(3)]],
		price: [this.product?.price ?? '', [Validators.required, Validators.min(0)]],
		description: [this.product?.description ?? '', [Validators.required, Validators.minLength(3)]],
		available: [this.product?.available ?? true],
		category: [this.product?.category ?? '', [Validators.required, Validators.minLength(3)]],
		image: [this.product?.image ?? '', Validators.required],
	});

	getErrorMessage(field: string): string {
		const control = this.productForm.get(field);
		if (control?.hasError('required')) {
			return 'Este campo es obligatorio';
		} else if (control?.hasError('minlength')) {
			return `El campo debe tener al menos ${control.errors?.['minlength'].requiredLength} caracteres`;
		} else if (control?.hasError('min')) {
			return 'El valor debe ser mayor o igual a 0';
		} else if (control?.hasError('image')) {
			return 'Ha ocurrido un error al subir la imagen';
		}
		return '';
	}

	public closeModal() {
		this.productsService.selectedProduct.set(null);
	}

	public saveProduct() {
		if (this.productForm.valid) {
			const formValues = this.productForm.value;
			const updatedProduct: Product = {
				id: this.productsService.selectedProduct()?.id ?? '',
				name: formValues.name as string,
				price: formValues.price as number,	
				description: formValues.description as string,
				available: formValues.available === true,
				category: formValues.category as string,
				image: formValues.image as string
			};
			this.productsService.updateProduct(updatedProduct).then(() => {
				this.closeModal();
			}).catch((error) => {
				this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error al guardar el producto: ${error}` });
			});
		} else {
			this.productForm.markAllAsTouched();
			this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Formulario inválido' });
		}
	}

	public async uploadImage(event: any) {
		const file = event.files[0];
		if (file) {
			this.productsService.uploadImage(file).subscribe((url) => {
				this.imagePreview = url;
				this.productForm.patchValue({ image: url });
			}, (error) => {
				this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al subir la imagen' });
			});
		}
	}

	public onFileSelected(event: any) {
		const file = event.target.files[0];
		if (file) {
			this.uploadImage({ files: [file] });
		}
	}

	public onDrop(event: DragEvent) {
		event.preventDefault();
		const file = event.dataTransfer?.files[0];
		if (file) {
			this.uploadImage({ files: [file] });
		}
	}

	public onDragOver(event: DragEvent) {
		event.preventDefault();
	}

	public cancelImage() {
		this.imagePreview = null;
		this.productForm.patchValue({ image: '' });
	}

	public changeImage() {
		document.getElementById('productImage')?.click();
	}

	fetchCategories() {
		this.productsService.getCategories().subscribe((categories) => {
			this.categories = categories;
		});
	}
}
