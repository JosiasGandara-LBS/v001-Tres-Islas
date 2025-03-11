import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'expirationDateFormat',
  standalone: true
})
export class ExpirationDateFormatPipe implements PipeTransform {

	transform(value: string): string {
		if (!value) return '';

		// Eliminar cualquier carácter no numérico
		const cleaned = value.replace(/\D/g, '');

		// Insertar la barra después de los primeros 2 dígitos
		if (cleaned.length <= 2) {
		  	return cleaned;
		} else {
		  	return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
		}
	}

}
