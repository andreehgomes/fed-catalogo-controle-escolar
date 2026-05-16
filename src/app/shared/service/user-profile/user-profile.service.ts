import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PerfilEnum } from '../../model/accout.enum';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly _perfil$ = new BehaviorSubject<PerfilEnum | null>(null);

  readonly perfil$ = this._perfil$.asObservable();

  setPerfil(perfil: string | null): void {
    const parsed = Object.values(PerfilEnum).includes(perfil as PerfilEnum)
      ? (perfil as PerfilEnum)
      : null;
    this._perfil$.next(parsed);
  }

  getPerfil(): PerfilEnum | null {
    return this._perfil$.getValue();
  }

  isEstagiario(): boolean {
    return this._perfil$.getValue() === PerfilEnum.ESTAGIARIO;
  }
}
