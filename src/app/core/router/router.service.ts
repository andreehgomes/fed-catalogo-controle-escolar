import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { RouterEnum } from './router.enum';

@Injectable({
  providedIn: 'root'
})
export class RouterService {

  route = RouterEnum;

  constructor(
    private router: Router,
    private zone: NgZone
  ) { }

  navigate(rota: string){
    this.zone.run(() => {
      this.router.navigate([rota]);
    })
  }

  navigateWithParams(rota: string, queryParams: { [key: string]: string }){
    this.zone.run(() => {
      this.router.navigate([rota], { queryParams });
    })
  }

}
