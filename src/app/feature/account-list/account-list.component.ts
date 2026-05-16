import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Auth } from '@angular/fire/auth';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AccountService } from 'src/app/shared/service/account/account.service';
import { AccountDataService } from 'src/app/shared/service/account/account-data.service';
import { LoaderService } from 'src/app/components/loader/loader.service';
import { ConfirmDeleteDialogComponent } from 'src/app/components/confirm-delete-dialog/confirm-delete-dialog.component';
import { AccountModel } from 'src/app/shared/model/accout.enum';
import { RouterEnum } from 'src/app/core/router/router.enum';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss'],
  standalone: false,
})
export class AccountListComponent implements OnInit {
  accounts: AccountModel[] = [];
  filtered: AccountModel[] = [];
  searchCtrl = new FormControl<string>('');
  currentUserUid: string = '';

  constructor(
    private accountService: AccountService,
    private accountDataService: AccountDataService,
    private router: Router,
    private loader: LoaderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fireAuth: Auth
  ) {}

  ngOnInit(): void {
    this.currentUserUid = this.fireAuth.currentUser?.uid ?? '';
    this.carregar();
    this.searchCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((term) => this.filtrar(term ?? ''));
  }

  private carregar(): void {
    this.loader.openDialog();
    this.accountService.getAllAccount()
      .then((list) => {
        this.accounts = list as AccountModel[];
        this.filtered = [...this.accounts];
        this.loader.closeDialog();
      })
      .catch(() => {
        this.loader.closeDialog();
        this.snackBar.open('Erro ao carregar usuários.', 'Fechar', {
          duration: 4000,
          verticalPosition: 'top',
        });
      });
  }

  private filtrar(term: string): void {
    const lower = term.toLowerCase().trim();
    this.filtered = lower
      ? this.accounts.filter(
          (a) =>
            a.nome?.toLowerCase().includes(lower) ||
            a.email?.toLowerCase().includes(lower)
        )
      : [...this.accounts];
  }

  novoUsuario(): void {
    this.router.navigate([RouterEnum.NEW_ACCOUNT]);
  }

  editar(account: AccountModel, event: Event): void {
    event.stopPropagation();
    this.accountDataService.obtemAccount(account as any, account.key!);
    this.router.navigate([RouterEnum.NEW_ACCOUNT]);
  }

  excluir(account: AccountModel, event: Event): void {
    event.stopPropagation();
    if (account.uid === this.currentUserUid) return;
    this.confirmarExclusao(account);
  }

  private confirmarExclusao(account: AccountModel): void {
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        titulo: 'Excluir usuário',
        mensagem: `Deseja excluir o usuário "${account.nome}"?`,
      },
    });
    ref.afterClosed().subscribe((confirm) => {
      if (!confirm) return;
      this.loader.openDialog();
      this.accountService.deleteAccount(account.key!);
      this.accounts = this.accounts.filter((a) => a.key !== account.key);
      this.filtrar(this.searchCtrl.value ?? '');
      this.loader.closeDialog();
      this.snackBar.open('Usuário excluído.', '', {
        duration: 2500,
        panelClass: ['snack-sucesso'],
        verticalPosition: 'top',
      });
    });
  }

  chipColor(perfil: string): string {
    switch (perfil?.toLowerCase()) {
      case 'master':
        return 'chip-master';
      case 'admin':
        return 'chip-admin';
      case 'estagiario':
      case 'estagiário':
        return 'chip-estagiario';
      default:
        return 'chip-default';
    }
  }
}
