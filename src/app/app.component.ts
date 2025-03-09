import { Component } from '@angular/core';
import { slideInAnimation } from './app.animations';
import { RouterOutlet } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    animations: [slideInAnimation], //para las animaciones slideRight y slideLeft
    standalone: true,
    imports: [IonicModule, RouterOutlet, IonRouterOutlet]
})
export class AppComponent {
    title = 'v001-tres-islas';
	
    prepareRoute(outlet: RouterOutlet) {
        return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
    }
}