export interface SaleItem {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorSubtotal: number;
}

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
  dataCriacao: string;
  dataAlteracao?: string;
}
