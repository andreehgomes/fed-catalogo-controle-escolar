export type EntregaStatus = 'pendente' | 'parcial' | 'entregue';

export interface EntregaItem {
  indice: number;
  descricao: string;
  quantidadeEntregue: number;
}

export interface Entrega {
  data: string;
  tipo: 'total' | 'parcial';
  itens: EntregaItem[];
  observacao?: string;
}
