import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
	selector: 'app-dropdown',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './dropdown.component.html',
	styleUrl: './dropdown.component.scss',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => DropdownComponent),
			multi: true,
		},
	],
})
export class DropdownComponent {
	@Input() disabled: boolean = false;

	isDropdownOpen = false;
	selectedOption: any = null;

	options = [
		{ name: 'Mesa 1', value: '1' },
		{ name: 'Mesa 2', value: '2' },
		{ name: 'Mesa 3', value: '3' },
		{ name: 'Mesa 4', value: '4' },
		{ name: 'Mesa 5', value: '5' },
		{ name: 'Mesa 6', value: '6' },
		{ name: 'Mesa 7', value: '7' },
		{ name: 'Mesa 8', value: '8' },
		{ name: 'Mesa 9', value: '9' },
		{ name: 'Mesa 10', value: '10' },
		{ name: 'Mesa 11', value: '11' },
		{ name: 'Mesa 12', value: '12' },
	];

	private onChange = (value: any) => {};
	private onTouched = () => {};

	toggleDropdown() {
		if (!this.disabled) {
			this.isDropdownOpen = !this.isDropdownOpen;
		}
	}

	selectOption(option: any) {
		if (!this.disabled) {
			this.selectedOption = option;
			this.onChange(option.value);
			this.isDropdownOpen = false;
		}
	  }

	// Métodos necesarios para ControlValueAccessor
	writeValue(value: any): void {
		this.selectedOption = this.options.find(opt => opt.value === value) || null;
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}

	setDisabledState?(isDisabled: boolean): void {
		// Manejar el estado deshabilitado si es necesario
	}
}
