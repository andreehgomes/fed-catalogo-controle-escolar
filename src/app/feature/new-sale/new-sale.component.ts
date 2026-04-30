import { Component, OnInit } from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { firstValueFrom } from "rxjs";
import { ClientService } from "src/app/shared/service/client/client.service";
import { CampaignService } from "src/app/shared/service/campaign/campaign.service";
import { SaleService } from "src/app/shared/service/sale/sale.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { Client } from "src/app/shared/model/client";
import { Campaign } from "src/app/shared/model/campaign";
import { Sale, SaleItem } from "src/app/shared/model/sale";
import { AlertasType } from "src/app/shared/model/alertas-type.enum";
import { RouterEnum } from "src/app/core/router/router.enum";

@Component({
  selector: "app-new-sale",
  templateUrl: "./new-sale.component.html",
  styleUrls: ["./new-sale.component.scss"],
  standalone: false,
})
export class NewSaleComponent implements OnInit {
  campaigns: Campaign[] = [];
  sugestoes: Client[] = [];
  alerta: { tipo: AlertasType; codigo: string; mensagem: string } | null = null;

  editingKey: string | null = null;
  private dataCriacaoOriginal: string | null = null;

  itemDescricaoCtrl = new FormControl<string>("", { nonNullable: true, validators: [Validators.required] });
  itemQuantidadeCtrl = new FormControl<number>(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] });
  itemValorUnitarioCtrl = new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]);
  aReceberCtrl = new FormControl<boolean>(false, { nonNullable: true });

  form: FormGroup = this.fb.group({
    campaignKey: ["", Validators.required],
    campaignNome: [""],
    clienteKey: [""],
    clienteNome: ["", Validators.required],
    itens: this.fb.array([]),
    valorTotal: [0],
    observacao: [""],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private campaignService: CampaignService,
    private saleService: SaleService,
    private loader: LoaderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.carregarCampanhas();

    const selected = this.saleService.selectedSale$.getValue();
    if (selected) {
      this.editingKey = selected.key ?? null;
      this.dataCriacaoOriginal = selected.dataCriacao;
      this.form.patchValue(
        {
          campaignKey: selected.campaignKey,
          campaignNome: selected.campaignNome,
          clienteKey: selected.clienteKey,
          clienteNome: selected.clienteNome,
          observacao: selected.observacao ?? "",
        },
        { emitEvent: false }
      );
      selected.itens?.forEach((item) => {
        this.itensArray.push(
          this.fb.group({
            descricao: [item.descricao],
            quantidade: [item.quantidade],
            valorUnitario: [item.valorUnitario],
            valorSubtotal: [item.valorSubtotal],
          })
        );
      });
      this.recalcularTotal();
      this.aReceberCtrl.setValue(selected.status === "pendente");
      this.saleService.selectedSale$.next(null);
    } else {
      const cliente = this.clientService.selectedClient$.getValue();
      if (cliente) {
        this.form.patchValue(
          { clienteKey: cliente.key, clienteNome: cliente.nome },
          { emitEvent: false }
        );
        this.clientService.selectedClient$.next(null);
      }
      const campaignKey = this.route.snapshot.queryParamMap.get("campaignKey");
      if (campaignKey) {
        this.form.patchValue({ campaignKey }, { emitEvent: false });
      }
    }

    this.form
      .get("clienteNome")!
      .valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((term: string) => {
        if (this.form.get("clienteKey")!.value) {
          this.form.patchValue({ clienteKey: "" }, { emitEvent: false });
        }
        if (!term || term.length < 2) {
          this.sugestoes = [];
          return;
        }
        this.clientService.getClients(term).subscribe((clients) => {
          this.sugestoes = clients;
        });
      });

    this.form.get("campaignKey")!.valueChanges.subscribe((key: string) => {
      const c = this.campaigns.find((x) => x.key === key);
      this.form.patchValue({ campaignNome: c?.nome ?? "" }, { emitEvent: false });
      if (!this.editingKey) {
        this.aplicarItensPadrao(c);
      }
    });

    this.itensArray.valueChanges.subscribe(() => this.recalcularTotal());
  }

  private carregarCampanhas(): void {
    this.campaignService.getActiveCampaigns().subscribe((list) => {
      this.campaigns = list;
      const currentKey = this.form.get("campaignKey")!.value;
      if (currentKey) {
        const c = list.find((x) => x.key === currentKey);
        if (c) {
          this.form.patchValue({ campaignNome: c.nome }, { emitEvent: false });
          if (!this.editingKey) {
            this.aplicarItensPadrao(c);
          }
        }
      }
    });
  }

  itensPadrao: { descricao: string; valorUnitario: number }[] = [];

  private aplicarItensPadrao(c?: Campaign): void {
    this.itensPadrao = c?.itensPadrao ?? [];
    if (this.itensPadrao.length === 0) {
      this.itemDescricaoCtrl.reset("");
      this.itemValorUnitarioCtrl.reset(null);
      return;
    }
    this.preencherItem(this.itensPadrao[0]);
  }

  preencherItem(it: { descricao: string; valorUnitario: number }): void {
    this.itemDescricaoCtrl.setValue(it.descricao);
    this.itemQuantidadeCtrl.setValue(1);
    this.itemValorUnitarioCtrl.setValue(it.valorUnitario);
  }

  limparItens(): void {
    this.itensArray.clear();
  }

  get itensArray(): FormArray {
    return this.form.get("itens") as FormArray;
  }

  selecionarCliente(c: Client): void {
    this.form.patchValue(
      { clienteKey: c.key ?? "", clienteNome: c.nome },
      { emitEvent: false }
    );
    this.sugestoes = [];
  }

  adicionarItem(): void {
    if (
      this.itemDescricaoCtrl.invalid ||
      this.itemQuantidadeCtrl.invalid ||
      this.itemValorUnitarioCtrl.invalid
    )
      return;

    const quantidade = Number(this.itemQuantidadeCtrl.value);
    const valorUnitario = Number(this.itemValorUnitarioCtrl.value);
    const valorSubtotal = +(quantidade * valorUnitario).toFixed(2);

    this.itensArray.push(
      this.fb.group({
        descricao: [this.itemDescricaoCtrl.value],
        quantidade: [quantidade],
        valorUnitario: [valorUnitario],
        valorSubtotal: [valorSubtotal],
      })
    );

    this.itemDescricaoCtrl.reset("");
    this.itemQuantidadeCtrl.reset(1);
    this.itemValorUnitarioCtrl.reset(null);
  }

  removerItem(i: number): void {
    this.itensArray.removeAt(i);
  }

  private recalcularTotal(): void {
    const total = this.itensArray.controls.reduce((acc, ctrl) => {
      return acc + (Number(ctrl.value.valorSubtotal) || 0);
    }, 0);
    this.form.patchValue({ valorTotal: +total.toFixed(2) }, { emitEvent: false });
  }

  async salvar(): Promise<void> {
    if (this.form.invalid || this.itensArray.length === 0) {
      this.alerta = {
        tipo: AlertasType.ALERTA,
        codigo: "400",
        mensagem: "Adicione pelo menos um item e selecione uma campanha.",
      };
      return;
    }
    this.alerta = null;
    this.loader.openDialog();
    try {
      const v = this.form.getRawValue();
      let clienteKey: string = v.clienteKey;
      const clienteNome: string = (v.clienteNome as string).trim();

      if (!clienteKey) {
        clienteKey = await firstValueFrom(
          this.clientService.newClient({ nome: clienteNome })
        );
      }

      const itens: SaleItem[] = (v.itens as any[]).map((i) => ({
        descricao: i.descricao,
        quantidade: i.quantidade,
        valorUnitario: i.valorUnitario,
        valorSubtotal: i.valorSubtotal,
      }));

      const now = new Date().toISOString();
      const aReceber = this.aReceberCtrl.value;
      const sale: Sale = {
        campaignKey: v.campaignKey,
        campaignNome: v.campaignNome,
        clienteKey,
        clienteNome,
        clienteNomeLower: clienteNome.toLowerCase(),
        itens,
        valorTotal: v.valorTotal,
        observacao: v.observacao?.trim() || undefined,
        status: aReceber ? "pendente" : "quitado",
        valorRecebido: aReceber ? 0 : v.valorTotal,
        dataCriacao:
          this.editingKey && this.dataCriacaoOriginal
            ? this.dataCriacaoOriginal
            : now,
        ...(this.editingKey ? { dataAlteracao: now } : {}),
      };

      if (!aReceber && !this.editingKey) {
        const recebimentoKey = now.replace(/[:.]/g, "-");
        sale.recebimentos = {
          [recebimentoKey]: {
            data: now.substring(0, 10),
            valor: v.valorTotal,
            descricao: "Pago no ato da venda",
          },
        };
      }

      if (this.editingKey) {
        await firstValueFrom(this.saleService.updateSale(this.editingKey, sale));
      } else {
        await firstValueFrom(this.saleService.newSale(sale));
      }

      this.snackBar.open("Venda registrada com sucesso!", "", {
        duration: 3000,
        panelClass: ["snack-sucesso"],
        verticalPosition: "top",
      });

      const navTarget = v.campaignKey;
      this.editingKey = null;
      this.form.reset({ valorTotal: 0 });
      this.itensArray.clear();

      setTimeout(
        () => this.router.navigate([RouterEnum.CAMPAIGN_DETAIL, navTarget]),
        300
      );
    } catch {
      this.alerta = {
        tipo: AlertasType.ERRO,
        codigo: "500",
        mensagem: "Erro ao salvar a venda. Tente novamente.",
      };
    } finally {
      this.loader.closeDialog();
    }
  }

  cancelar(): void {
    this.router.navigate([RouterEnum.FEED]);
  }

  fmt(v: number): string {
    return v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
