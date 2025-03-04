import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'keysLength',
  standalone: true
})
export class KeysLengthPipe implements PipeTransform {

	transform(obj: any): number {
		return obj ? Object.keys(obj).length : 0;
	}

}
