import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidenavService {
  private toggle$ = new Subject<void>();
  toggle = this.toggle$.asObservable();

  emit() {
    this.toggle$.next();
  }
}
