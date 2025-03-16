import { CommonModule } from '@angular/common';
import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
	selector: 'app-dropdown-togo',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './dropdown-togo.component.html',
	styleUrl: './dropdown-togo.component.scss',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => DropdownTogoComponent),
			multi: true,
		},
	],
})
export class DropdownTogoComponent {
	isDropdownOpen = false;
	selectedOption: any = null;

	options = [
		{ name: 'Para comer aquí', value: 0 },
		{ name: 'Para llevar', value: 1 },
	];

	private onChange = (value: any) => {};
	private onTouched = () => {};

	toggleDropdown() {
		this.isDropdownOpen = !this.isDropdownOpen;
	}

	selectOption(option: any) {
		this.selectedOption = option;
		this.onChange(option.value); // Comunica el valor seleccionado al formulario reactivo
		this.isDropdownOpen = false;
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
