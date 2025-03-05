import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { DynamicDialogModule } from 'primeng/dynamicdialog';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    provideFirebaseApp(() => initializeApp({"projectId":"v001-tres-islas","appId":"1:960197070111:web:290042c5ed81f43961742a","storageBucket":"v001-tres-islas.firebasestorage.app","apiKey":"AIzaSyAmh1UUiezJub6CBabwvCDND6PN_nuDdys","authDomain":"v001-tres-islas.firebaseapp.com","messagingSenderId":"960197070111","measurementId":"G-319X4NLHW4"})), 
    provideAuth(() => getAuth()), 
    provideFirestore(() => getFirestore()), 
    provideFirebaseApp(() => initializeApp({"projectId":"v001-tres-islas","appId":"1:960197070111:web:290042c5ed81f43961742a","storageBucket":"v001-tres-islas.firebasestorage.app","apiKey":"AIzaSyAmh1UUiezJub6CBabwvCDND6PN_nuDdys","authDomain":"v001-tres-islas.firebaseapp.com","messagingSenderId":"960197070111","measurementId":"G-319X4NLHW4"})), 
    provideStorage(() => getStorage()),
		importProvidersFrom(BrowserAnimationsModule),
		importProvidersFrom(HttpClientModule),
		importProvidersFrom(DynamicDialogModule)
  ]
};
