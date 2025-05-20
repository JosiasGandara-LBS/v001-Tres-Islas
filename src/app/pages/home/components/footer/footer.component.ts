import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
	email: string = "tresislascocina@gmail.com";

	descargarTerminosCondiciones() {
		const link = document.createElement('a');
		link.href = 'assets/documents/Terminos_y_Condiciones_Tres_Islas.pdf';
		link.download = 'Terminos_y_Condiciones_Tres_Islas.pdf';
		link.click();
	}
}
