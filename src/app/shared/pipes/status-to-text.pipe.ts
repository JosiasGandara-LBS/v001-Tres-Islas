import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'statusToText',
	standalone: true
})
export class StatusToTextPipe implements PipeTransform {

	transform(value: number, ...args: unknown[]): unknown {

		switch (value) {
			case 1:
				return 'Pago pendiente';
			case 2:
				return 'Pendiente';
			case 3:
				return 'Entregado';
			default:
				return value;
		}
	}

}
