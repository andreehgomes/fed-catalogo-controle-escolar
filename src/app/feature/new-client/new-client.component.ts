import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Observable } from "rxjs";
import { ClientService } from "src/app/shared/service/client/client.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { Client } from "src/app/shared/model/client";
import { AlertasType } from "src/app/shared/model/alertas-type.enum";
import { RouterEnum } from "src/app/core/router/router.enum";

@Component({
  selector: "app-new-client",
  templateUrl: "./new-client.component.html",
  styleUrls: ["./new-client.component.scss"],
  standalone: false,
})
export class NewClientComponent implements OnInit {
  alerta: { tipo: AlertasType; codigo: string; mensagem: string } | null = null;
  editingKey: string | null = null;

  form: FormGroup = this.fb.group({
    nome: ["", Validators.required],
    telefone: [""],
  });

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private router: Router,
    private loader: LoaderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const selected = this.clientService.selectedClient$.getValue();
    if (selected) {
      this.editingKey = selected.key ?? null;
      this.form.patchValue({
        nome: selected.nome,
        telefone: selected.telefone ?? "",
      });
      this.clientService.selectedClient$.next(null);
    }
  }

  salvar(): void {
    if (this.form.invalid) return;
    this.alerta = null;
    this.loader.openDialog();

    const v = this.form.getRawValue();
    const client: Client = {
      nome: v.nome.trim(),
      telefone: v.telefone?.trim() || undefined,
    };

    const obs$: Observable<unknown> = this.editingKey
      ? this.clientService.updateClient(this.editingKey, client)
      : this.clientService.newClient(client);

    obs$.subscribe({
      next: () => {
        this.loader.closeDialog();
        this.snackBar.open(
          this.editingKey ? "Cliente atualizado!" : "Cliente cadastrado!",
          "",
          { duration: 3000, panelClass: ["snack-sucesso"], verticalPosition: "top" }
        );
        this.editingKey = null;
        this.router.navigate([RouterEnum.CLIENT_LIST]);
      },
      error: () => {
        this.loader.closeDialog();
        this.alerta = {
          tipo: AlertasType.ERRO,
          codigo: "500",
          mensagem: "Erro ao salvar cliente. Tente novamente.",
        };
      },
    });
  }

  cancelar(): void {
    this.router.navigate([RouterEnum.CLIENT_LIST]);
  }
}
