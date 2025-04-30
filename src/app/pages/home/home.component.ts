import { Component } from '@angular/core';
import { HeroMenuComponent } from './components/hero-menu/hero-menu.component';
import { ModalItemComponent } from './components/modal-item/modal-item.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';


@Component({
	selector: 'app-home',
	standalone: true,
	imports: [HeroMenuComponent, NavbarComponent, FooterComponent],
	templateUrl: './home.component.html',
	styleUrl: './home.component.scss'
})

export class HomeComponent {

	constructor() {}

}
