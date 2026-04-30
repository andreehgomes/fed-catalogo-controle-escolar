import { getCurrencySymbol } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

/**
 * Dado uma sigla de moeda (BRL, USD, JPY, etc) é retornado seu
 * símbolo. Exemplo: BRL retorna R$
 */
@Pipe({
    name: 'siglaMoeda',
    standalone: false
})
export class SiglaMoedaPipe implements PipeTransform {
    transform(value: string): any {
        return getCurrencySymbol(value, 'wide');
    }
}
