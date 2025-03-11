import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'creditCardFormat',
	standalone: true
})
export class CreditCardFormatPipe implements PipeTransform {

	transform(value: string): string {
		if (!value) return '';

		// Eliminar espacios y caracteres no numéricos
		const cleaned = value.replace(/\D/g, '').slice(0, 16);

		// Agregar espacios después de cada 4 dígitos (máximo 16 dígitos)
		return cleaned.replace(/(\d{4})/g, '$1  ').trim();
	}

}
