import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OnloadService {

  onLoadBehavior: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);

  constructor() { }
}
