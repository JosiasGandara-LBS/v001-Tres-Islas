import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
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
		OnlinePaymentStatus: [false, [Validators.required]],
		ProductDiscountEnabled: [false, [Validators.required]],
		ProductDiscountStartTime: [null, [Validators.required]],
		ProductDiscountEndTime: [null, [Validators.required]],
		tableName: [null],
		kitchenHours: this.fb.array([]) as FormArray, // Especificar tipo FormArray
	}));

	public daysOfWeek = [
	  { label: 'Domingo', value: 0 },
	  { label: 'Lunes', value: 1 },
	  { label: 'Martes', value: 2 },
	  { label: 'Miércoles', value: 3 },
	  { label: 'Jueves', value: 4 },
	  { label: 'Viernes', value: 5 },
	  { label: 'Sábado', value: 6 },
	];

	editTableForm: FormGroup = this.fb.group({
		name: ['', Validators.required]
	});
	editingTableId: number | null = null;

	public tables = signal<any[]>([]);

	ngOnInit(): void {
		this.getConfigs();
		this.initKitchenHoursForm();
	}

	initKitchenHoursForm() {
		// Inicializa el formArray de kitchenHours con 7 días
		const arr = this.fb.array<FormGroup>([]);
		for (let i = 0; i < 7; i++) {
		  arr.push(this.fb.group({
			enabled: [false],
			start: ['08:00'],
			end: ['08:00']
		  }));
		}
		this.configsForm().setControl('kitchenHours', arr);
	}

	get kitchenHoursFormArray() {
		return this.configsForm().get('kitchenHours') as FormArray;
	}

	saveConfigs() {
		const configs = {
			CashPaymentToGoStatus: this.configsForm().get('CashPaymentToGoStatus')?.value,
			OnlinePaymentStatus: this.configsForm().get('OnlinePaymentStatus')?.value,
			ProductDiscountEnabled: this.configsForm().get('ProductDiscountEnabled')?.value,
			ProductDiscountStartTime: this.configsForm().get('ProductDiscountStartTime')?.value,
			ProductDiscountEndTime: this.configsForm().get('ProductDiscountEndTime')?.value,
			kitchenHours: this.configsForm().get('kitchenHours')?.value,
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
					OnlinePaymentStatus: configs.OnlinePaymentStatus,
				});
				if (configs.kitchenHours) {
					const arr = this.fb.array<FormGroup>([]);
					for (let i = 0; i < 7; i++) {
					  arr.push(this.fb.group({
						name: [this.daysOfWeek[i].label],
						enabled: [configs.kitchenHours[i]?.enabled ?? false],
						start: [configs.kitchenHours[i]?.start ?? '08:00'],
						end: [configs.kitchenHours[i]?.end ?? '08:00']
					  }));
					}
					this.configsForm().setControl('kitchenHours', arr);
				}
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

	getKitchenHourEnabled(i: number): boolean {
		const arr = this.configsForm().get('kitchenHours') as FormArray;
		return !!arr && !!arr.at(i)?.get('enabled')?.value;
	}
}
