import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes),
  provideFirebaseApp(() => initializeApp({
    apiKey: "AIzaSyAP3h1Nol6RQRJCVB-udUuZZwJJxSzClPo",
    authDomain: "da-bubble-2-aaf4a.firebaseapp.com",
    projectId: "da-bubble-2-aaf4a",
    storageBucket: "da-bubble-2-aaf4a.firebasestorage.app",
    messagingSenderId: "521473775678",
    appId: "1:521473775678:web:c9fae5c3ee21dbbd7b196f"
  })),
  provideAuth(() => getAuth()),
  provideFirestore(() => getFirestore()),
  provideDatabase(() => getDatabase())]
};

