export interface Expense {
  key?: string;
  campaignKey: string;
  campaignNome: string;
  descricao: string;
  valor: number;
  data: string;                // YYYY-MM-DD
  comprovanteFileName?: string; // nome do arquivo no Storage (pra deletar depois)
  comprovanteUrl?: string;      // URL pública do download
  dataCriacao: string;          // ISO 8601 UTC
  dataAlteracao?: string;
}
