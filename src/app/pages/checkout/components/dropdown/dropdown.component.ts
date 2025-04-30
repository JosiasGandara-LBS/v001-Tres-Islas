import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

type VoidFunction = () => void;

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

	@Input() options: string[] = [];

	private onChange = (value: string) => {};
	private onTouched = () => {};

	toggleDropdown() {
		if (!this.disabled) {
			this.isDropdownOpen = !this.isDropdownOpen;
		}
	}

	selectOption(option: string, index: number) {
		if (!this.disabled) {
			this.selectedOption = option;
			this.onChange(option);
			this.isDropdownOpen = false;
		}
	  }

	// Métodos necesarios para ControlValueAccessor
	writeValue(value: string): void {
		this.selectedOption = value || null;
	}

	registerOnChange(fn: VoidFunction): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: VoidFunction): void {
		this.onTouched = fn;
	}

	setDisabledState?(isDisabled: boolean): void {
		// Manejar el estado deshabilitado si es necesario
	}
}
