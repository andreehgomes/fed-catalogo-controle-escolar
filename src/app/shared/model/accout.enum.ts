export interface AccountModel {
    key?: string;
    nome: string;
    celular: string;
    data_nascimento: string;
    senha: string;
    email?: string;
    uid?: string;
    perfil?: string;
}

export enum PerfilEnum {
  MASTER     = 'master',
  ADMIN      = 'admin',
  ESTAGIARIO = 'estagiario',
}