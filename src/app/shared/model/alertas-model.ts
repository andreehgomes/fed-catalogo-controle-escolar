import { AlertasType } from "./alertas-type.enum";

export class AlertaModel {
    tipo: AlertasType;
    codigo: string;
    mensagem: string;
}