import { Component, OnInit, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UntypedFormControl, UntypedFormGroup, Validators, NgForm } from '@angular/forms';
import { AccountService } from 'src/app/shared/service/account/account.service';
import { AccountDataService } from 'src/app/shared/service/account/account-data.service';
import { NewAccount } from './shared/model/new-account';
import { AlertaModel } from 'src/app/shared/model/alertas-model';
import { DateAdapter } from '@angular/material/core';
import { RouterEnum } from 'src/app/core/router/router.enum';
import { AnalyticsService } from 'src/app/shared/service/analytics/analytics.service';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-new-account',
    templateUrl: './new-account.component.html',
    styleUrls: ['./new-account.component.scss'],
    standalone: false
})
export class NewAccountComponent implements OnInit {
  route = RouterEnum;

  @ViewChild('formDirective') private formDirective: NgForm;

  hide = true;
  modoEdicao = false;
  private editKey = '';

  newAccount: NewAccount = new NewAccount();
  mensagemRespostaCadastro: AlertaModel = new AlertaModel();
  sucesso: boolean = false;
  erro: boolean = false;

  constructor(
    private accountService: AccountService,
    private accountDataService: AccountDataService,
    private datePipe: DatePipe,
    private analytics: AnalyticsService
  ) {}

  formControlNewAccount = new UntypedFormGroup({
    nome: new UntypedFormControl(null, [Validators.required]),
    dataNascimento: new UntypedFormControl(null, [Validators.required]),
    novaSenha: new UntypedFormControl(null, [Validators.required, Validators.minLength(6)]),
    celular: new UntypedFormControl(null, [Validators.required]),
    email: new UntypedFormControl(null, [Validators.required]),
    perfil: new UntypedFormControl(null, [Validators.required]),
  });

  ngOnInit(): void {
    this.analytics.pageView({ funcionalidade: 'nova-conta' });
    this.accountDataService.accountAtual.pipe(take(1)).subscribe((data) => {
      if (!data.account || !data.key) return;
      this.modoEdicao = true;
      this.editKey = data.key;
      this.preencherFormEdicao(data.account as any);
      this.accountDataService.obtemAccount(null as any, '');
    });
  }

  private preencherFormEdicao(acc: any): void {
    let dataNascimento: Date | null = null;
    if (acc.data_nascimento) {
      const parts = acc.data_nascimento.split('/');
      if (parts.length === 3) {
        dataNascimento = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      }
    }
    this.formControlNewAccount.get('novaSenha')?.clearValidators();
    this.formControlNewAccount.get('novaSenha')?.updateValueAndValidity();
    this.formControlNewAccount.patchValue({
      nome: acc.nome,
      celular: acc.celular,
      email: acc.email,
      dataNascimento,
      perfil: acc.perfil ?? null,
    });
  }

  onSubmit() {
    if (this.modoEdicao) {
      this.salvarEdicao();
      return;
    }

    const { nome, dataNascimento, novaSenha, celular, email, perfil } =
      this.formControlNewAccount.controls;

    this.newAccount = {
      nome: nome.value,
      data_nascimento: this.datePipe.transform(dataNascimento.value, 'dd/MM/yyyy'),
      celular: celular.value,
      senha: novaSenha.value,
      email: email.value,
      perfil: perfil.value,
    };

    this.accountService
      .insertNewAccountEmail(this.newAccount)
      .subscribe(() => {
        this.accountService.responseInsertNewAccount.subscribe((mensagem) => {
          this.mensagemRespostaCadastro = mensagem;
          if (this.mensagemRespostaCadastro) {
            if (this.mensagemRespostaCadastro.codigo == '200') {
              this.sucesso = true;
              this.erro = false;
            } else if (this.mensagemRespostaCadastro.codigo == '500') {
              this.erro = true;
              this.sucesso = false;
            }
          }
        });
      });

    this.zerarForm();
  }

  private salvarEdicao(): void {
    const { nome, dataNascimento, novaSenha, celular, email, perfil } =
      this.formControlNewAccount.controls;
    const account: NewAccount = {
      nome: nome.value,
      data_nascimento: this.datePipe.transform(dataNascimento.value, 'dd/MM/yyyy'),
      celular: celular.value,
      email: email.value,
      perfil: perfil.value,
      senha: novaSenha.value ?? '',
    };
    this.accountService.updateAccount(account, this.editKey);
    this.sucesso = true;
    this.erro = false;
    this.modoEdicao = false;
    this.editKey = '';
    this.zerarForm();
  }

  zerarForm() {
    this.formControlNewAccount.reset();
    this.formDirective.resetForm();
    for (let control in this.formControlNewAccount.controls) {
      this.formControlNewAccount.controls[control].setErrors(null);
    }
    this.formControlNewAccount = new UntypedFormGroup({
      nome: new UntypedFormControl(null, [Validators.required]),
      dataNascimento: new UntypedFormControl(null, [Validators.required]),
      novaSenha: new UntypedFormControl(null, [Validators.required, Validators.minLength(6)]),
      celular: new UntypedFormControl(null, [Validators.required]),
      email: new UntypedFormControl(null, [Validators.required]),
      perfil: new UntypedFormControl(null, [Validators.required]),
    });
  }
}
