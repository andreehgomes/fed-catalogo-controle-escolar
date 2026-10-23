import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { from, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { UserProfileService } from '../../shared/service/user-profile/user-profile.service';
import { AccountService } from '../../shared/service/account/account.service';
import { RouterEnum } from '../router/router.enum';

/**
 * Permite acesso somente ao perfil Master. Qualquer outro perfil é
 * redirecionado para o feed. Deve ser usado APÓS authGuard e roleGuard.
 */
export const masterGuard: CanActivateFn = () => {
  const userProfileService = inject(UserProfileService);
  const router = inject(Router);
  const auth = inject(Auth);
  const accountService = inject(AccountService);

  if (userProfileService.getPerfil() !== null) {
    return userProfileService.isMaster()
      ? true
      : router.createUrlTree([RouterEnum.FEED]);
  }

  return authState(auth).pipe(
    take(1),
    switchMap((user) => {
      if (!user) return of(true);
      return from(accountService.getAccountByUidKey(user.uid)).pipe(
        map((accounts) => {
          userProfileService.setPerfil(accounts[0]?.perfil ?? null);
          return userProfileService.isMaster()
            ? true
            : router.createUrlTree([RouterEnum.FEED]);
        })
      );
    })
  );
};
