import { Injectable } from '@angular/core';
import { FirebaseOptions } from '@angular/fire/app';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConfigFirebaseService {
  private configFireBasePipeLineProd = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId,
  };

  private configFireBaseLocalPipeLineTeste = {
    apiKey: 'AIzaSyALnvoK_6yQhkUQAydqFVenPc5nfbx-Rt0',
    authDomain: 'toca-fominha-dev.firebaseapp.com',
    projectId: 'toca-fominha-dev',
    storageBucket: 'toca-fominha-dev.appspot.com',
    messagingSenderId: '1058881912976',
    appId: '1:1058881912976:web:bc7c7a321699d199929815',
    measurementId: 'G-E23NL8YSJM',
  };

  constructor() {}

  getConfigFireBase(): FirebaseOptions {
    return environment.production
      ? this.configFireBasePipeLineProd
      : this.configFireBaseLocalPipeLineTeste;
  }
}
