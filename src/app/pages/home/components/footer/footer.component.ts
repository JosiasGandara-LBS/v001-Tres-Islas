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
		link.href = 'assets/documents/Términos y Condiciones de Uso, Aviso de Privacidad - Cervecería Tres Islas.pdf';
		link.download = 'Términos y Condiciones de Uso, Aviso de Privacidad - Cervecería Tres Islas.pdf';
		link.click();
	}
}
