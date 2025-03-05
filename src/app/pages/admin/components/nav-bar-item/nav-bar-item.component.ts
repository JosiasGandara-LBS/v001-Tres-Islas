import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-bar-item',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './nav-bar-item.component.html',
  styleUrls: ['./nav-bar-item.component.scss']
})
export class NavBarItemComponent {
	@Input() route: string;
	@Input() name: string;
	@Input() icon: string;

	constructor() {
		this.route = '';
		this.name = '';
		this.icon = '';
	}
}
