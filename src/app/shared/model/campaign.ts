export type CampaignStatus = 'ativa' | 'encerrada';

export interface CampaignDefaultItem {
  descricao: string;
  valorUnitario: number;
}

export interface Campaign {
  key?: string;
  nome: string;
  nomeLower?: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  meta?: number;
  status: CampaignStatus;
  itensPadrao?: CampaignDefaultItem[];
  dataCriacao: string;
  dataAlteracao?: string;
}
