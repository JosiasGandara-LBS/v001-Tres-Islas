import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'statusToText',
	standalone: true
})
export class StatusToTextPipe implements PipeTransform {

	transform(value: unknown, ...args: unknown[]): unknown {
		if (typeof value !== 'string') {
			return value;
		}

		switch (value) {
			case 'delivered':
				return 'Entregado';
			case 'payment-pending':
				return 'Pago pendiente';
			case 'pending':
				return 'Pendiente';
			default:
				return value;
		}
	}

}
