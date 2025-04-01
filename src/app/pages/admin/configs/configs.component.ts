import { ProductsService } from '@core/services/products.service';
import { Component, inject, OnInit, signal } from '@angular/core';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { KitchenStatusService } from '@core/services/kitchen-status.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-configs',
  standalone: true,
  imports: [InputSwitchModule, CommonModule, ReactiveFormsModule],
  templateUrl: './configs.component.html',
  styleUrl: './configs.component.scss'
})
export class ConfigsComponent implements OnInit{
	private fb = inject(FormBuilder);
	private kitchenService = inject(KitchenStatusService);
	private productsService = inject(ProductsService);

	public configsForm = signal(this.fb.group({
		CashPaymentToGoStatus: [false, [Validators.required]],
		ProductDiscountEnabled: [false, [Validators.required]],
		ProductDiscountStartTime: [null, [Validators.required]],
		ProductDiscountEndTime: [null, [Validators.required]],
	}));

	ngOnInit(): void {
		this.getConfigs()
	}


	saveConfigs() {
		const configs = {
			CashPaymentToGoStatus: this.configsForm().get('CashPaymentToGoStatus')?.value,
			ProductDiscountEnabled: this.configsForm().get('ProductDiscountEnabled')?.value,
			ProductDiscountStartTime: this.configsForm().get('ProductDiscountStartTime')?.value,
			ProductDiscountEndTime: this.configsForm().get('ProductDiscountEndTime')?.value,
		};
		try {
			if (!this.configsForm().valid) {
				Swal.fire({
					title: 'Error',
					text: 'Por favor completa todos los campos',
					icon: 'error',
					confirmButtonText: 'Aceptar'
				});
				return;
			}
			this.kitchenService.saveConfigs(configs).then(() => {}).catch((error) => {
				throw new Error('Error al guardar configuraciones de cocina: ' + error);
			});

			this.productsService.setProductDiscounts({
				enabled: configs.ProductDiscountEnabled,
				startTime: configs.ProductDiscountStartTime,
				endTime: configs.ProductDiscountEndTime,
			}).then(() => {}).catch((error) => {
				throw new Error('Error al guardar descuentos de productos: ' + error);
			});

			Swal.fire({
				title: 'Configuraciones guardadas',
				text: 'Las configuraciones se han guardado correctamente',
				icon: 'success',
				confirmButtonText: 'Aceptar'
			});
		} catch (error) {
			Swal.fire({
				title: 'Error',
				text: 'Ocurrió un error al guardar las configuraciones: ' + error,
				icon: 'error',
				confirmButtonText: 'Aceptar'
			});
		}
	}

	getConfigs() {
		this.kitchenService.getConfigs().subscribe((configs: any) => {
			if (configs) {
				this.configsForm().patchValue({
					CashPaymentToGoStatus: configs.CashPaymentToGoStatus,
				});
			}
		});

		this.productsService.getProductDiscounts().then((discounts: any) => {
			if (discounts) {
				this.configsForm().patchValue({
					ProductDiscountEnabled: discounts.enabled,
					ProductDiscountStartTime: discounts.startTime,
					ProductDiscountEndTime: discounts.endTime,
				});
			}
		});
	}

	resetConfigs() {
		this.getConfigs();
		Swal.fire({
			title: 'Configuraciones restauradas',
			text: 'Las configuraciones se han restaurado a los valores por defecto',
			icon: 'success',
			confirmButtonText: 'Aceptar'
		});
		this.configsForm().markAsPristine();
	}


}
