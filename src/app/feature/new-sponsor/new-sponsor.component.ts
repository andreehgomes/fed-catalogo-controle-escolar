import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CampaignService } from "src/app/shared/service/campaign/campaign.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { Campaign, CampaignSponsor, SponsorTipo } from "src/app/shared/model/campaign";
import { AlertasType } from "src/app/shared/model/alertas-type.enum";
import { RouterEnum } from "src/app/core/router/router.enum";

@Component({
  selector: "app-new-sponsor",
  templateUrl: "./new-sponsor.component.html",
  styleUrls: ["./new-sponsor.component.scss"],
  standalone: false,
})
export class NewSponsorComponent implements OnInit {
  alerta: { tipo: AlertasType; codigo: string; mensagem: string } | null = null;
  campaign?: Campaign;
  campaignKey: string = "";

  tipoCtrl = new FormControl<SponsorTipo>("valor", { nonNullable: true });

  form: FormGroup = this.fb.group({
    nome: ["", Validators.required],
    valor: [null],
    produto: [""],
    observacao: [""],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private loader: LoaderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.campaignKey = this.route.snapshot.paramMap.get("key") ?? "";
    if (!this.campaignKey) {
      this.router.navigate([RouterEnum.CAMPAIGN_LIST]);
      return;
    }
    this.loader.openDialog();
    this.campaignService.getCampaignByKey(this.campaignKey).subscribe({
      next: (c) => {
        this.campaign = c;
        this.loader.closeDialog();
      },
      error: () => {
        this.loader.closeDialog();
        this.router.navigate([RouterEnum.CAMPAIGN_LIST]);
      },
    });
  }

  salvar(): void {
    const tipo = this.tipoCtrl.value;
    const v = this.form.getRawValue();
    const nome = (v.nome ?? "").trim();

    if (!nome) {
      this.alerta = {
        tipo: AlertasType.ALERTA,
        codigo: "400",
        mensagem: "Informe o nome do patrocinador.",
      };
      return;
    }
    if (tipo === "valor" && (!v.valor || v.valor <= 0)) {
      this.alerta = {
        tipo: AlertasType.ALERTA,
        codigo: "400",
        mensagem: "Informe um valor maior que zero.",
      };
      return;
    }
    if (tipo === "produto" && !(v.produto ?? "").trim()) {
      this.alerta = {
        tipo: AlertasType.ALERTA,
        codigo: "400",
        mensagem: "Informe o produto patrocinado.",
      };
      return;
    }
    if (!this.campaign) return;

    this.alerta = null;
    this.loader.openDialog();

    const sponsor: CampaignSponsor = { nome, tipo };
    if (tipo === "valor") sponsor.valor = Number(v.valor);
    else sponsor.produto = (v.produto as string).trim();
    if ((v.observacao ?? "").trim()) sponsor.observacao = (v.observacao as string).trim();

    const lista = [...(this.campaign.patrocinadores ?? []), sponsor];

    this.campaignService
      .updatePatrocinadores(this.campaignKey, lista)
      .then(() => {
        this.snackBar.open("Patrocínio adicionado!", "", {
          duration: 3000,
          panelClass: ["snack-sucesso"],
          verticalPosition: "top",
        });
        this.router.navigate([RouterEnum.CAMPAIGN_DETAIL, this.campaignKey]);
      })
      .catch(() => {
        this.loader.closeDialog();
        this.alerta = {
          tipo: AlertasType.ERRO,
          codigo: "500",
          mensagem: "Erro ao salvar patrocínio. Tente novamente.",
        };
      });
  }

  cancelar(): void {
    this.router.navigate([RouterEnum.CAMPAIGN_DETAIL, this.campaignKey]);
  }

  fmt(v: number): string {
    return v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
