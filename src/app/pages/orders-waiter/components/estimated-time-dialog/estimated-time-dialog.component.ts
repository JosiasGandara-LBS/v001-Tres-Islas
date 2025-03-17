import { Component, EventEmitter, inject, input, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { KitchenStatusService } from '@core/services/kitchen-status.service';
@Component({
  selector: 'app-estimated-time-dialog',
  standalone: true,
  imports: [CommonModule, InputNumberModule, ReactiveFormsModule],
  templateUrl: './estimated-time-dialog.component.html',
  styleUrl: './estimated-time-dialog.component.scss'
})
export class EstimatedTimeDialogComponent implements OnInit {
	@Output() close = new EventEmitter<void>();

  private kitchenStatusService = inject(KitchenStatusService);

	public time: number = 0;
  public form = new FormGroup({
    time: new FormControl('', [Validators.required, Validators.min(1)])
  });

  ngOnInit(): void {
    this.kitchenStatusService.getOrdersEstimatedTime().subscribe((data) => {
      this.time = data || 0;
    });
  }

	closeModal() {
    this.form.reset();
		this.close.emit();
	}
	setEstimatedTime() {
    this.kitchenStatusService.setOrdersEstimatedTime(this.time);
		this.closeModal()
	}

}