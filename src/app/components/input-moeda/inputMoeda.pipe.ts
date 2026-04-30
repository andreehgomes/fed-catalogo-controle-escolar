import { Pipe, PipeTransform } from '@angular/core';
import { formatCurrency, getCurrencySymbol } from '@angular/common';

@Pipe({
    name: 'formatarNumeroMoeda',
    standalone: false
})
export class InputMoedaPipe implements PipeTransform {
    transform(
        value: number,
        currencyCode: string = 'BRL',
        digitsInfo: string = '1.2-2',
        separadorDecimal: string = ',',
        separadorMilhar: string = '.',
        renderizarSimboloMoeda: boolean = true
    ): string | null {
        if (value === null) {
            return '';
        }

        const simboloMoeda = renderizarSimboloMoeda
            ? getCurrencySymbol(currencyCode, 'wide')
            : '';

        const resultadoPipeAngular = formatCurrency(
            value,
            'en-US',
            simboloMoeda,
            currencyCode,
            digitsInfo
        );

        return resultadoPipeAngular
            .replace(/[\,]+/g, '!')
            .replace(/\./g, separadorDecimal)
            .replace(/\!+/g, separadorMilhar);
    }
}
