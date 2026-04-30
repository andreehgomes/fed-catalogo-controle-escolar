import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from 'src/app/components/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-lista-recebimentos',
  templateUrl: './lista-recebimentos.component.html',
  styleUrls: ['./lista-recebimentos.component.scss'],
  standalone: false,
})
export class ListaRecebimentosComponent {
  @Input() recebimentos: { key: string; data: string; valor: number; descricao: string }[] = [];
  @Output() excluir = new EventEmitter<string>();

  constructor(private readonly dialog: MatDialog) {}

  onExcluir(key: string): void {
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '320px',
      data: {
        titulo: 'Excluir pagamento',
        mensagem: 'Tem certeza que deseja excluir este pagamento?',
      },
    });
    ref.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.excluir.emit(key);
      }
    });
  }

  fmt(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
