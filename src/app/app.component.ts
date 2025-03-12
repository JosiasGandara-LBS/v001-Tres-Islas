import { Component } from '@angular/core';
import { slideInAnimation } from './app.animations';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    animations: [slideInAnimation], //para las animaciones slideRight y slideLeft
    standalone: true,
    imports: [RouterOutlet]
})
export class AppComponent {
    title = 'v001-tres-islas';
	
    prepareRoute(outlet: RouterOutlet) {
        return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
    }
}