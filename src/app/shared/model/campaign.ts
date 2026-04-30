export type CampaignStatus = 'ativa' | 'encerrada';

export interface Campaign {
  key?: string;
  nome: string;
  nomeLower?: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  meta?: number;
  status: CampaignStatus;
  dataCriacao: string;
  dataAlteracao?: string;
}
