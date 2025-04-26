import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { KitchenStatusService } from '@core/services/kitchen-status.service';
import Swal from 'sweetalert2';
import { PromotionsService } from '@core/services/promotions.service';
import { DividerModule } from 'primeng/divider';
@Component({
  selector: 'app-configs',
  standalone: true,
  imports: [InputSwitchModule, CommonModule, ReactiveFormsModule, DividerModule],
  templateUrl: './configs.component.html',
  styleUrl: './configs.component.scss'
})
export class ConfigsComponent implements OnInit{
	private fb = inject(FormBuilder);
	private kitchenService = inject(KitchenStatusService);
	private promotionsService = inject(PromotionsService);

	public configsForm = signal(this.fb.group({
		CashPaymentToGoStatus: [false, [Validators.required]],
		ProductDiscountEnabled: [false, [Validators.required]],
		ProductDiscountStartTime: [null, [Validators.required]],
		ProductDiscountEndTime: [null, [Validators.required]],
		tableName: [null],
	}));

	editTableForm: FormGroup = this.fb.group({
		name: ['', Validators.required]
	});
	editingTableId: number | null = null;

	public tables = signal<any[]>([]);

	ngOnInit(): void {
		this.getConfigs()
	}

	constructor() {
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

			this.promotionsService.setProductDiscounts("3X2TYT3A5", {
				enabled: configs.ProductDiscountEnabled,
				startTime: configs.ProductDiscountStartTime,
				endTime: configs.ProductDiscountEndTime,
			}).then(() => {}).catch((error) => {
				throw new Error('Error al guardar descuentos de productos: ' + error);
			});

			this.saveTables();

			Swal.fire({
				title: 'Configuraciones guardadas',
				text: 'Las configuraciones se han guardado correctamente',
				icon: 'success',
				confirmButtonText: 'Aceptar'
			});
			this.configsForm().markAsPristine();
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

		this.promotionsService.getProductDiscounts("3X2TYT3A5").then((discounts: any) => {
			if (discounts) {
				this.configsForm().patchValue({
					ProductDiscountEnabled: discounts.enabled,
					ProductDiscountStartTime: discounts.startTime,
					ProductDiscountEndTime: discounts.endTime,
				});
			}
		});
		this.getTables();
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
		this.editTableForm.reset();
		this.editingTableId = null;
	}

	getTables() {
		this.kitchenService.getTables().subscribe((tables: any) => {
			// Ensure that we only set an array
			this.tables.set(Array.isArray(tables) ? tables : []);
		});
	}

	saveTables() {
		this.kitchenService.saveTables(this.tables()).then(() => {
			this.editTableForm.reset();
			this.editingTableId = null;
		});
	}

	addTable() {
		const newTable: string = this.configsForm().get('tableName')?.value || "";
		if (!newTable) {
			Swal.fire({
				title: 'Error',
				text: 'Por favor ingresa un nombre para la mesa',
				icon: 'error',
				confirmButtonText: 'Aceptar'
			});
			return;
		}
		if (this.tables().includes(newTable.toUpperCase())) {
			Swal.fire({
				title: 'Error',
				text: 'El nombre de la mesa ya existe',
				icon: 'error',
				confirmButtonText: 'Aceptar'
			});
			this.configsForm().get('tableName')?.setValue(null);
			return;
		}
		const currentTables = this.tables();
		const updatedTables = [...currentTables, newTable.toUpperCase()];
		this.tables.set(updatedTables);
		this.configsForm().get('tableName')?.setValue(null);
	}

	deleteTable(index: number) {
		const updatedTables = [...this.tables()];
		updatedTables.splice(index, 1);
		this.tables.set(updatedTables);
		this.editTableForm.reset();
		this.editingTableId = null;
	}

	editTable(index: number) {
		this.editingTableId = index;
		this.editTableForm.patchValue({ name: this.tables()[index] });
	}

	updateTable(index: number) {
		if (this.editTableForm.valid) {
			const updatedTables = [...this.tables()];
			updatedTables[index] = this.editTableForm.get('name')?.value;
			this.tables.set(updatedTables);
			this.editTableForm.reset();
			this.editingTableId = null;
		}
	}

}
