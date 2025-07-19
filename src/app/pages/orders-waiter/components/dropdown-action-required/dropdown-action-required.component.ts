import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

type VoidFunction = () => void;

@Component({
  selector: 'app-dropdown-action-required',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-action-required.component.html',
  styleUrl: './dropdown-action-required.component.scss',
  providers: [
	{
		provide: NG_VALUE_ACCESSOR,
		useExisting: forwardRef(() => DropdownActionRequiredComponent),
		multi: true,
	},
  ]
})
export class DropdownActionRequiredComponent {

	isDropdownOpen = false;
	selectedOption: any = null;

	options = [
		{ name: 'No se encontró su mesa, favor de pasar a cocina', value: 0 },
	];

	private onChange = (value: any) => {};
	private onTouched = () => {};

	toggleDropdown() {
		this.isDropdownOpen = !this.isDropdownOpen;
	}

	selectOption(option: any) {
		this.selectedOption = option;
		this.onChange(option.value);
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
