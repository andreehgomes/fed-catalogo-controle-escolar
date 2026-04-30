import { Injectable } from '@angular/core';
import { ResponseLogin } from 'src/app/feature/login/shared/model/response-login';
import { Auth, signOut } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { Token } from 'src/app/shared/model/token';

@Injectable({
  providedIn: 'root'
})
export class InitAuthService {
  usuario$: BehaviorSubject<Token> = new BehaviorSubject<Token>(null);

  constructor(private fireAuth: Auth) { }

  getToken(): Token | undefined {
    const login = localStorage.getItem('token');    
    if(!!login){
      return JSON.parse(window.atob(localStorage.getItem('token')));
    }
    return;
  }
  getUsuario() {
    const login = localStorage.getItem('usuario');    
    if(!!login){
      return JSON.parse(window.atob(localStorage.getItem('usuario')));
    }
    return;
  }

  getAuth(): any {
    const auth = this.getToken();
    if(!!auth){
      
      return JSON.parse(decodeURIComponent(encodeURIComponent(window.atob(auth['auth']))))
    }
    return;
  }

  logout(){
    signOut(this.fireAuth);
  }



}
