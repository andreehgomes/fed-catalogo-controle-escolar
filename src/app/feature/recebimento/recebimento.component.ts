import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SaleService } from "src/app/shared/service/sale/sale.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { Sale } from "src/app/shared/model/sale";
import { RouterEnum } from "src/app/core/router/router.enum";
import { AlertasType } from "src/app/shared/model/alertas-type.enum";

@Component({
  selector: "app-recebimento",
  templateUrl: "./recebimento.component.html",
  styleUrls: ["./recebimento.component.scss"],
  standalone: false,
})
export class RecebimentoComponent implements OnInit {
  sale: Sale | null = null;
  saleKey: string = "";
  private origemRota: string | null = null;

  alerta: { tipo: AlertasType; codigo: string; mensagem: string } | null = null;

  form: FormGroup = this.fb.group({
    data: [new Date().toLocaleDateString("en-CA"), Validators.required],
    valor: [null, [Validators.required, Validators.min(0.01)]],
    descricao: [""],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private saleService: SaleService,
    private loader: LoaderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.saleKey = this.route.snapshot.paramMap.get("saleKey") ?? "";
    this.origemRota = this.route.snapshot.queryParamMap.get("origem");

    if (!this.saleKey) {
      this.router.navigate([RouterEnum.CONTAS_A_RECEBER]);
      return;
    }

    this.loader.openDialog();
    this.saleService.getSaleByKey(this.saleKey).subscribe({
      next: (sale) => {
        this.sale = sale;
        const saldo = sale.valorTotal - (sale.valorRecebido ?? 0);
        this.form.get("valor")!.setValidators([
          Validators.required,
          Validators.min(0.01),
          Validators.max(saldo),
        ]);
        this.form.get("valor")!.updateValueAndValidity();
        this.form.patchValue({ valor: saldo });
        this.loader.closeDialog();
      },
      error: () => {
        this.alerta = {
          tipo: AlertasType.ERRO,
          codigo: "404",
          mensagem: "Venda não encontrada.",
        };
        this.loader.closeDialog();
      },
    });
  }

  get saldo(): number {
    if (!this.sale) return 0;
    return this.sale.valorTotal - (this.sale.valorRecebido ?? 0);
  }

  fmt(value: number): string {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async salvar(): Promise<void> {
    if (this.form.invalid || !this.sale) return;
    this.alerta = null;
    this.loader.openDialog();
    try {
      const v = this.form.getRawValue();
      const novoValorRecebido = (this.sale.valorRecebido ?? 0) + v.valor;
      const quitar = novoValorRecebido >= this.sale.valorTotal;
      await this.saleService.addRecebimento(
        this.saleKey,
        { data: v.data, valor: v.valor, descricao: v.descricao || "" },
        novoValorRecebido,
        quitar
      );
      this.snackBar.open(
        quitar ? "Venda quitada!" : "Recebimento registrado!",
        "",
        {
          duration: 3000,
          panelClass: ["snack-sucesso"],
          verticalPosition: "top",
        }
      );
      setTimeout(() => this.navegarAposSalvar(), 400);
    } catch {
      this.alerta = {
        tipo: AlertasType.ERRO,
        codigo: "500",
        mensagem: "Erro ao registrar recebimento. Tente novamente.",
      };
      this.loader.closeDialog();
    }
  }

  cancelar(): void {
    this.navegarAposSalvar();
  }

  private navegarAposSalvar(): void {
    if (this.origemRota === RouterEnum.CLIENT_DETAIL && this.sale?.clienteKey) {
      this.router.navigate([RouterEnum.CLIENT_DETAIL, this.sale.clienteKey]);
    } else {
      this.router.navigate([RouterEnum.CONTAS_A_RECEBER]);
    }
  }
}
