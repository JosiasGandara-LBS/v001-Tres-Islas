import { ApplicationConfig } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { firebaseConfig } from 'src/environment/firebase.config';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(routes, withViewTransitions()),
		provideHttpClient(withFetch()),
		provideFirebaseApp(() => initializeApp(firebaseConfig)),
		provideAuth(() => getAuth()),
		provideFirestore(() => getFirestore()),
		provideFirebaseApp(() => initializeApp(firebaseConfig)),
		provideStorage(() => getStorage()),
		importProvidersFrom(HttpClientModule),
		importProvidersFrom(BrowserAnimationsModule),
		importProvidersFrom(DynamicDialogModule),
		DialogService, provideFirebaseApp(() => initializeApp(firebaseConfig)), provideFunctions(() => getFunctions())
	]
};
