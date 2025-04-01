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

	public configsForm = signal(this.fb.group({
		CashPaymentToGoStatus: [false, [Validators.required]],
	}));

	ngOnInit(): void {
		this.kitchenService.getConfigs().subscribe((configs: any) => {
			console.log(configs)
			if (configs) {
				this.configsForm().setValue({
					CashPaymentToGoStatus: configs.CashPaymentToGoStatus,
				});
			}
		});
	}


	saveConfigs() {
		const configs = {
			CashPaymentToGoStatus: this.configsForm().get('CashPaymentToGoStatus')?.value,
		};

		this.kitchenService.saveConfigs(configs).then(() => {
			Swal.fire({
				title: 'Configuraciones guardadas',
				text: 'Las configuraciones se han guardado correctamente',
				icon: 'success',
			 confirmButtonText: 'Aceptar'
			});
		}).catch((error) => {
			console.error('Error al guardar configuraciones', error);
		});
	}

	resetConfigs() {
		const sub = this.kitchenService.getConfigs().subscribe((configs: any) => {
			if (configs) {
				this.configsForm().setValue({
					CashPaymentToGoStatus: configs.CashPaymentToGoStatus,
				});
			}
			sub.unsubscribe();
		}
		);
		Swal.fire({
			title: 'Configuraciones restauradas',
			text: 'Las configuraciones se han restaurado a los valores por defecto',
			icon: 'success',
			confirmButtonText: 'Aceptar'
		});
	}

}
