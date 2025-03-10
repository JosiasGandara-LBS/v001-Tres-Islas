import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateLongText',
  standalone: true
})
export class TruncateLongTextPipe implements PipeTransform {

  transform(value: string, limit: number = 50): string {
		if (!value) return '';
		return (value.length > limit ? value.substring(0, limit) : value) + '...';
	}

}
