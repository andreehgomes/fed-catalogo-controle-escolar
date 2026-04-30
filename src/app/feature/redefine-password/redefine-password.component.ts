import { Component, OnInit, ViewChild } from "@angular/core";
import { UntypedFormControl, UntypedFormGroup, NgForm, Validators } from "@angular/forms";
import { RouterEnum } from "../../core/router/router.enum";
import { Router } from "express";
import { RedefinePasswordService } from "./shared/redefine-password.service";
import { AlertaModel } from "src/app/shared/model/alertas-model";
import { AnalyticsService } from "src/app/shared/service/analytics/analytics.service";

@Component({
    selector: "app-redefine-password",
    templateUrl: "./redefine-password.component.html",
    styleUrls: ["./redefine-password.component.scss"],
    standalone: false
})
export class RedefinePasswordComponent implements OnInit {
  @ViewChild("formDirective") private formDirective: NgForm;
  route = RouterEnum;
  mensagemRedefinirSenha: AlertaModel;

  constructor(
    private redefinePassword: RedefinePasswordService,
    private analytics: AnalyticsService
  ) {}

  formControlNewPass = new UntypedFormGroup({
    email: new UntypedFormControl(null, [
      Validators.required,
      Validators.email,
      Validators.min(6),
    ]),
  });

  ngOnInit(): void {
    this.analytics.pageView({ funcionalidade: 'redefinir-senha' });
  }

  onSubmit() {
    const { email } = this.formControlNewPass.controls;
    this.redefinePassword.redefinirSenha(email.value).then(() => {
      this.redefinePassword.mensageRedefinirSenha.subscribe((mensagem) => {
        this.mensagemRedefinirSenha = mensagem;
        this.zerarForm();
      });
    });
  }

  zerarForm() {
    this.formControlNewPass.reset();
    this.formDirective.resetForm();
    for (let control in this.formControlNewPass.controls) {
      this.formControlNewPass.controls[control].setErrors(null);
    }
    this.formControlNewPass = new UntypedFormGroup({
      email: new UntypedFormControl(null, [
        Validators.required,
        Validators.email,
        Validators.min(6),
      ]),
    });
  }
}
