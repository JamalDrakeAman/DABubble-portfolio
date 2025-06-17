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
    apiKey: "AIzaSyA3LuocqYiQrd7UhKKmUNqu4AwVi0bPzTM",
  authDomain: "da-bubble-portfolio-37c55.firebaseapp.com",
  projectId: "da-bubble-portfolio-37c55",
  storageBucket: "da-bubble-portfolio-37c55.firebasestorage.app",
  messagingSenderId: "974797652046",
  appId: "1:974797652046:web:4f0993fcd99fb093bf831f"
  })),
  provideAuth(() => getAuth()),
  provideFirestore(() => getFirestore()),
  provideDatabase(() => getDatabase())]
};

