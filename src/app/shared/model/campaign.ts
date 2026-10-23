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
  // Quando false, as vendas desta campanha não aparecem na lista de
  // entregas (ex.: rifa, bingo). Omisso = true para preservar o
  // comportamento das campanhas já cadastradas.
  controlaEntrega?: boolean;
  dataCriacao: string;
  dataAlteracao?: string;
}
