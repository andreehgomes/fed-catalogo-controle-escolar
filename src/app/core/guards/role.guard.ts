import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { from, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { UserProfileService } from '../../shared/service/user-profile/user-profile.service';
import { AccountService } from '../../shared/service/account/account.service';
import { RouterEnum } from '../router/router.enum';

export const roleGuard: CanActivateFn = () => {
  const userProfileService = inject(UserProfileService);
  const router = inject(Router);
  const auth = inject(Auth);
  const accountService = inject(AccountService);

  // Caminho rápido: perfil já em cache (navegação interna sem refresh)
  if (userProfileService.getPerfil() !== null) {
    return userProfileService.isEstagiario()
      ? router.createUrlTree([RouterEnum.ENTREGA_LIST])
      : true;
  }

  // Perfil ainda não carregado: acesso direto via URL ou refresh de página
  return authState(auth).pipe(
    take(1),
    switchMap((user) => {
      if (!user) return of(true); // authGuard trata este caso
      return from(accountService.getAccountByUidKey(user.uid)).pipe(
        map((accounts) => {
          userProfileService.setPerfil(accounts[0]?.perfil ?? null);
          return userProfileService.isEstagiario()
            ? router.createUrlTree([RouterEnum.ENTREGA_LIST])
            : true;
        })
      );
    })
  );
};
