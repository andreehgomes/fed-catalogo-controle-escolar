export type CampaignStatus = 'ativa' | 'encerrada';

export interface CampaignDefaultItem {
  descricao: string;
  valorUnitario: number;
}

export type SponsorTipo = 'valor' | 'produto';

export interface CampaignSponsor {
  nome: string;
  tipo: SponsorTipo;
  valor?: number;       // R$ — quando tipo === 'valor'
  produto?: string;     // descrição do produto — quando tipo === 'produto'
  observacao?: string;
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
  patrocinadores?: CampaignSponsor[];
  dataCriacao: string;
  dataAlteracao?: string;
}
