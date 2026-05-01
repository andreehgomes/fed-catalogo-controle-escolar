import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { firstValueFrom } from "rxjs";
import { CampaignService } from "src/app/shared/service/campaign/campaign.service";
import { ExpenseService } from "src/app/shared/service/expense/expense.service";
import { FileService } from "src/app/shared/service/file/file.service";
import { LoaderService } from "src/app/components/loader/loader.service";
import { ConvertFileService } from "src/app/core/utils/convert-file.service";
import { Campaign } from "src/app/shared/model/campaign";
import { Expense } from "src/app/shared/model/expense";
import { FileUploadModel } from "src/app/shared/model/file-upload-model";
import { AlertasType } from "src/app/shared/model/alertas-type.enum";
import { RouterEnum } from "src/app/core/router/router.enum";

@Component({
  selector: "app-new-expense",
  templateUrl: "./new-expense.component.html",
  styleUrls: ["./new-expense.component.scss"],
  standalone: false,
})
export class NewExpenseComponent implements OnInit {
  @ViewChild("inputImage", { static: false }) inputImage!: ElementRef;

  alerta: { tipo: AlertasType; codigo: string; mensagem: string } | null = null;
  campaigns: Campaign[] = [];
  editingKey: string | null = null;
  private dataCriacaoOriginal: string | null = null;
  private comprovanteOriginal?: { fileName?: string; url?: string };

  comprovantePreview: string | null = null;
  private fileUpload: FileUploadModel | null = null;

  form: FormGroup = this.fb.group({
    campaignKey: ["", Validators.required],
    descricao: ["", Validators.required],
    valor: [null, [Validators.required, Validators.min(0.01)]],
    data: [new Date().toLocaleDateString("en-CA"), Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private expenseService: ExpenseService,
    private fileService: FileService,
    private convertFile: ConvertFileService,
    private loader: LoaderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loader.openDialog();
    this.campaignService.getAllCampaigns().subscribe({
      next: (list) => {
        this.campaigns = list;
        this.loader.closeDialog();
      },
      error: () => this.loader.closeDialog(),
    });

    const campaignKey = this.route.snapshot.queryParamMap.get("campaignKey");
    if (campaignKey) {
      this.form.patchValue({ campaignKey });
    }

    const selected = this.expenseService.selectedExpense$.getValue();
    if (selected) {
      this.editingKey = selected.key ?? null;
      this.dataCriacaoOriginal = selected.dataCriacao;
      this.comprovanteOriginal = {
        fileName: selected.comprovanteFileName,
        url: selected.comprovanteUrl,
      };
      this.form.patchValue({
        campaignKey: selected.campaignKey,
        descricao: selected.descricao,
        valor: selected.valor,
        data: selected.data,
      });
      if (selected.comprovanteUrl) this.comprovantePreview = selected.comprovanteUrl;
      this.expenseService.selectedExpense$.next(null);
    }
  }

  clickInputImage(): void {
    (this.inputImage.nativeElement as HTMLInputElement).click();
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files.item(0)!;

    this.convertFile.fileToBase64(file).then((base64) => {
      const image = new Image();
      image.src = base64;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = image.width;
        let height = image.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(image, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.9);

        this.comprovantePreview = compressed;
        this.fileUpload = new FileUploadModel(
          this.base64toFile(compressed, file.name)
        );
      };
    });
    input.value = "";
  }

  removerComprovante(): void {
    this.comprovantePreview = null;
    this.fileUpload = null;
  }

  private base64toFile(dataURL: string, fileName: string): File {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) return;
    this.alerta = null;
    this.loader.openDialog();

    try {
      const v = this.form.getRawValue();
      const campaign = this.campaigns.find((c) => c.key === v.campaignKey);
      const now = new Date().toISOString();

      let comprovanteFileName = this.comprovanteOriginal?.fileName;
      let comprovanteUrl = this.comprovanteOriginal?.url;

      if (this.fileUpload) {
        const result = await firstValueFrom(this.fileService.pushFileToStorage(this.fileUpload));
        if (this.editingKey && this.comprovanteOriginal?.fileName) {
          await firstValueFrom(
            this.fileService.deleteFileStorage(this.comprovanteOriginal.fileName)
          );
        }
        comprovanteFileName = result.fileName;
        comprovanteUrl = result.url;
      } else if (!this.comprovantePreview && this.editingKey && this.comprovanteOriginal?.fileName) {
        await firstValueFrom(
          this.fileService.deleteFileStorage(this.comprovanteOriginal.fileName)
        );
        comprovanteFileName = undefined;
        comprovanteUrl = undefined;
      }

      const expense: Expense = {
        campaignKey: v.campaignKey,
        campaignNome: campaign?.nome ?? "",
        descricao: v.descricao.trim(),
        valor: Number(v.valor),
        data: v.data,
        dataCriacao:
          this.editingKey && this.dataCriacaoOriginal
            ? this.dataCriacaoOriginal
            : now,
        ...(comprovanteFileName ? { comprovanteFileName } : {}),
        ...(comprovanteUrl ? { comprovanteUrl } : {}),
        ...(this.editingKey ? { dataAlteracao: now } : {}),
      };

      if (this.editingKey) {
        await firstValueFrom(this.expenseService.updateExpense(this.editingKey, expense));
      } else {
        await firstValueFrom(this.expenseService.newExpense(expense));
      }

      this.snackBar.open(
        this.editingKey ? "Despesa atualizada!" : "Despesa cadastrada!",
        "",
        { duration: 3000, panelClass: ["snack-sucesso"], verticalPosition: "top" }
      );

      const navTarget = v.campaignKey;
      this.editingKey = null;
      this.router.navigate([RouterEnum.CAMPAIGN_DETAIL, navTarget]);
    } catch (err) {
      console.error("Erro ao salvar despesa:", err);
      this.alerta = {
        tipo: AlertasType.ERRO,
        codigo: "500",
        mensagem: "Erro ao salvar despesa. Tente novamente.",
      };
    } finally {
      this.loader.closeDialog();
    }
  }

  cancelar(): void {
    const campaignKey = this.form.get("campaignKey")?.value;
    if (campaignKey) {
      this.router.navigate([RouterEnum.CAMPAIGN_DETAIL, campaignKey]);
    } else {
      this.router.navigate([RouterEnum.EXPENSE_LIST]);
    }
  }

  fmt(v: number): string {
    return v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
