import { Injectable } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {

  constructor(private fireAuth: Auth) { }

  getAuthState(): Observable<any> {
    return authState(this.fireAuth);
  }
}
