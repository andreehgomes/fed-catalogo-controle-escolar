import { Component, OnInit } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Observable } from "rxjs";
import { CampaignService } from "src/app/shared/service/campaign/campaign.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { Campaign, CampaignDefaultItem } from "src/app/shared/model/campaign";
import { AlertasType } from "src/app/shared/model/alertas-type.enum";
import { RouterEnum } from "src/app/core/router/router.enum";

@Component({
  selector: "app-new-campaign",
  templateUrl: "./new-campaign.component.html",
  styleUrls: ["./new-campaign.component.scss"],
  standalone: false,
})
export class NewCampaignComponent implements OnInit {
  alerta: { tipo: AlertasType; codigo: string; mensagem: string } | null = null;
  editingKey: string | null = null;
  private dataCriacaoOriginal: string | null = null;

  itemDescricaoCtrl = new FormControl<string>("", { nonNullable: true, validators: [Validators.required] });
  itemValorCtrl = new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]);

  form: FormGroup = this.fb.group({
    nome: ["", Validators.required],
    descricao: [""],
    dataInicio: ["", Validators.required],
    dataFim: [""],
    meta: [null],
    status: ["ativa", Validators.required],
    itensPadrao: this.fb.array([]),
  });

  constructor(
    private fb: FormBuilder,
    private campaignService: CampaignService,
    private router: Router,
    private loader: LoaderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const selected = this.campaignService.selectedCampaign$.getValue();
    if (selected) {
      this.editingKey = selected.key ?? null;
      this.dataCriacaoOriginal = selected.dataCriacao;
      this.form.patchValue({
        nome: selected.nome,
        descricao: selected.descricao ?? "",
        dataInicio: selected.dataInicio,
        dataFim: selected.dataFim ?? "",
        meta: selected.meta ?? null,
        status: selected.status,
      });
      selected.itensPadrao?.forEach((it) => {
        this.itensPadraoArray.push(
          this.fb.group({
            descricao: [it.descricao],
            valorUnitario: [it.valorUnitario],
          })
        );
      });
      this.campaignService.selectedCampaign$.next(null);
    }
  }

  get itensPadraoArray(): FormArray {
    return this.form.get("itensPadrao") as FormArray;
  }

  adicionarItemPadrao(): void {
    if (this.itemDescricaoCtrl.invalid || this.itemValorCtrl.invalid) return;
    this.itensPadraoArray.push(
      this.fb.group({
        descricao: [this.itemDescricaoCtrl.value],
        valorUnitario: [Number(this.itemValorCtrl.value)],
      })
    );
    this.itemDescricaoCtrl.reset("");
    this.itemValorCtrl.reset(null);
  }

  removerItemPadrao(i: number): void {
    this.itensPadraoArray.removeAt(i);
  }

  salvar(): void {
    if (this.form.invalid) return;
    this.alerta = null;
    this.loader.openDialog();

    const v = this.form.getRawValue();
    const itensPadrao: CampaignDefaultItem[] = (v.itensPadrao as any[]).map((i) => ({
      descricao: i.descricao,
      valorUnitario: i.valorUnitario,
    }));

    const now = new Date().toISOString();
    const campaign: Campaign = {
      nome: v.nome.trim(),
      descricao: v.descricao?.trim() || undefined,
      dataInicio: v.dataInicio,
      dataFim: v.dataFim || undefined,
      meta: v.meta || undefined,
      status: v.status,
      itensPadrao: itensPadrao.length > 0 ? itensPadrao : undefined,
      dataCriacao: this.editingKey && this.dataCriacaoOriginal ? this.dataCriacaoOriginal : now,
    };

    const obs$: Observable<unknown> = this.editingKey
      ? this.campaignService.updateCampaign(this.editingKey, campaign)
      : this.campaignService.newCampaign(campaign);

    obs$.subscribe({
      next: () => {
        this.loader.closeDialog();
        this.snackBar.open(
          this.editingKey ? "Campanha atualizada!" : "Campanha criada!",
          "",
          { duration: 3000, panelClass: ["snack-sucesso"], verticalPosition: "top" }
        );
        this.editingKey = null;
        this.router.navigate([RouterEnum.CAMPAIGN_LIST]);
      },
      error: () => {
        this.loader.closeDialog();
        this.alerta = {
          tipo: AlertasType.ERRO,
          codigo: "500",
          mensagem: "Erro ao salvar campanha. Tente novamente.",
        };
      },
    });
  }

  cancelar(): void {
    this.router.navigate([RouterEnum.CAMPAIGN_LIST]);
  }

  fmt(v: number): string {
    return v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
