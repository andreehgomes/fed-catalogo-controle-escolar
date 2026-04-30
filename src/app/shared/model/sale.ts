export interface SaleItem {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorSubtotal: number;
}

export interface Recebimento {
  data: string;        // ISO date YYYY-MM-DD
  valor: number;
  descricao: string;
}

export type SaleStatus = 'pendente' | 'quitado';

export interface Sale {
  key?: string;
  campaignKey: string;
  campaignNome: string;
  clienteKey: string;
  clienteNome: string;
  clienteNomeLower: string;
  itens: SaleItem[];
  valorTotal: number;
  observacao?: string;
  status?: SaleStatus;
  valorRecebido?: number;
  recebimentos?: { [key: string]: Recebimento };
  dataCriacao: string;
  dataAlteracao?: string;
}
