import {
  Component,
  HostListener,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  ViewChild,
  OnChanges,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonTypeEvent, CommonValueEvent, ICommonEvents } from './i-common-events';

@Component({
    selector: 'input-moeda',
    templateUrl: './input-moeda.component.html',
    styleUrls: ['./input-moeda.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputMoedaComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class InputMoedaComponent implements ControlValueAccessor, OnChanges {
  @Input() autofocus = false;
  @Input() helpText = '';
  @Input() helpTextAriaHidden = false;
  @Input() label = '';
  @Input() maxlength: number;
  @Input() moeda = 'BRL';
  @Input() mostrarSimboloComoPrefixo = false;
  @Input() perderFocoQuandoPressionarEnter = false;
  @Input() qtdDigitosAposVirgula = 2;
  @Input() renderizarSimboloMoeda = true;
  @Input() separadorDecimal: string = ',';
  @Input() separadorMilhar: string = '.';
  @Input() title = '';
  @Input() disabled = false;
  @Input() mostrarIconeStatus = false;
  @Output() aoPerderFoco = new EventEmitter<void>();

  @Input() onlyInt = false;

  @Output() commonEvents: EventEmitter<ICommonEvents> = new EventEmitter();

  @ViewChild('inputChild', { static: true })
  inputChild: ElementRef<HTMLInputElement>;

  // https://angular.io/api/common/CurrencyPipe
  digitsInfo = `1.${this.qtdDigitosAposVirgula}-${this.qtdDigitosAposVirgula}`;
  desabilitado = this.disabled;
  value = '';
  idInput: string;
  valorAtual: number;
  valorInput: number;
  reactiveFormsRegisterOnChange = (val: any) => val;
  reactiveFormsRegisterOnTouched = () => {};
  get temClasseNGInvalid(): boolean {
    return this.hostElement.nativeElement.classList.contains('ng-invalid');
  }

  @HostListener('keydown.enter')
  hostKeydownEnter() {
    if (this.perderFocoQuandoPressionarEnter) {
      this.inputChild.nativeElement.blur();
    }
  }

  @HostListener('blur')
  hostBlur() {
    this.reactiveFormsRegisterOnTouched();
  }
  @HostListener('focus')
  setFocus() {
    this.inputChild.nativeElement.focus();
  }

  constructor(private hostElement: ElementRef) {
    // Cria um id randômico para vincular o label ao input
    this.idInput = Math.random().toString(36).substring(2);
  }

  ngOnInit(): void {
    this.emitInit();
  }

  ngOnDestroy(): void {
    this.emitDestroy();
  }

  emitInit(): void {
    this.commonEvents.emit({
      event: CommonTypeEvent.init,
      target: this.hostElement.nativeElement,
      value: CommonValueEvent.initiated,
    });
  }

  emitDestroy() {
    this.commonEvents.emit({
      event: CommonTypeEvent.destroy,
      target: this.hostElement.nativeElement,
      value: CommonValueEvent.destroyed,
    });
  }

  ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
    if (changes.qtdDigitosAposVirgula) {
      const aux = changes.qtdDigitosAposVirgula.currentValue;
      this.digitsInfo = `1.${aux}-${aux}`;

      this.valorAtual = null;
      this.reactiveFormsRegisterOnChange(this.valorAtual);
    }
  }

  handleDecimalChanges(e) {
    if (this.onlyInt) {
      const selectionPositionStart = e.target.selectionStart;
      const selectionPositionEnd = e.target.selectionEnd;

      const inputTotalLength = this.inputChild.nativeElement.value.length;
      const blockedBackspaceLength = 3;

      const differenceCalcStart = inputTotalLength - selectionPositionStart;
      const differenceCalcEnd = inputTotalLength - selectionPositionEnd;

      this.PreventDeleteDecimal(
        differenceCalcStart,
        differenceCalcEnd,
        blockedBackspaceLength,
        e
      );
      this.changeCursorOnDecimal(
        differenceCalcStart,
        differenceCalcEnd,
        blockedBackspaceLength
      );
    }
  }

  changeCursorOnDecimal(
    differenceCalcStart,
    differenceCalcEnd,
    blockedBackspaceLength
  ) {
    if (
      differenceCalcStart < blockedBackspaceLength ||
      differenceCalcEnd < blockedBackspaceLength
    ) {
      this.inputChild.nativeElement.focus();
      this.inputChild.nativeElement.setSelectionRange(
        this.inputChild.nativeElement.value.length - 3,
        this.inputChild.nativeElement.value.length - 3
      );
    }
  }

  PreventDeleteDecimal(
    differenceCalcStart,
    differenceCalcEnd,
    blockedBackspaceLength,
    e: any
  ) {
    const diff = e.key === 'Backspace' ? 0 : 1;

    if (e.key == 'Backspace' || e.key == 'Delete') {
      if (
        differenceCalcStart < blockedBackspaceLength + diff ||
        differenceCalcEnd < blockedBackspaceLength + diff
      ) {
        this.deleteAndConcatIntInput(e, blockedBackspaceLength);
      }
    }
  }

  deleteAndConcatIntInput(e, blockedBackspaceLength) {
    e.preventDefault();

    this.inputChild.nativeElement.value = this.inputChild.nativeElement.value
      .substring(
        0,
        this.inputChild.nativeElement.value.length -
          (blockedBackspaceLength + 1)
      )
      .concat(',00');

    this.inputChild.nativeElement.focus();
    this.inputChild.nativeElement.setSelectionRange(
      this.inputChild.nativeElement.value.length - 3,
      this.inputChild.nativeElement.value.length - 3
    );
  }

  atualizarValor(valorInput: string) {
    if (this.onlyInt) {
      valorInput = valorInput.replace(',00', '');

      // Valida number
      valorInput = valorInput.replace(/[Ａ-Ｚａ-ｚ０-９]/g, '');
      valorInput = valorInput
        .replace(/[^0-9\.]+/g, '')
        .replace(/\./g, '')
        .replace(/\,/g, '');

      this.inputChild.nativeElement.value = valorInput + ',00';

      this.valorAtual = Number(
        this.inputChild.nativeElement.value.replace(',00', '')
      );
      this.reactiveFormsRegisterOnChange(this.valorAtual);
    } else {
      const valorInputLength = valorInput.length;
      let inputElement = this.inputChild.nativeElement;
      // Retiramos o último caractere se não for um digito
      if (
        valorInputLength > 0 &&
        !/\d/.test(valorInput[valorInputLength - 1])
      ) {
        inputElement.value = this.inputChild.nativeElement.value.slice(0, -1);
        return;
      }

      const valorInputDigitos = valorInput.replace(/\D/g, '');
      const valorInputDigitosLength = valorInputDigitos.length;

      // Verifica o maxlength
      if (this.maxlength && valorInputDigitosLength > this.maxlength) {
        inputElement.value = inputElement.value.slice(0, -1);
        return;
      }

      // Se temos qtdDigitosAposVirgula=2, então o input nunca poderá ser "0,000", deverá sempre
      // ser "0,00" independente de quantos zeros o usuário digitar
      if (
        +valorInputDigitos === 0 &&
        valorInputDigitosLength > this.qtdDigitosAposVirgula + 1
      ) {
        inputElement.value = inputElement.value.slice(0, -1);
        this.valorAtual = 0;
        this.reactiveFormsRegisterOnChange(this.valorAtual);
        return;
      }

      // Se o usuário está vendo "0,00" e apertar um backspace para 0,0, o valor deixa de ser zero
      // e passa a ser null
      if (
        this.valorAtual === 0 &&
        +valorInputDigitos === 0 &&
        valorInputDigitosLength < this.qtdDigitosAposVirgula + 1
      ) {
        inputElement.value = '';
        this.valorAtual = null;
        this.reactiveFormsRegisterOnChange(this.valorAtual);
        return;
      }

      const fatorDeDivisao = +('1' + '0'.repeat(this.qtdDigitosAposVirgula));
      this.valorAtual = +valorInput.replace(/\D/g, '') / fatorDeDivisao;
      this.reactiveFormsRegisterOnChange(this.valorAtual);
    }
  }

  writeValue(obj: any): void {
    this.valorAtual = obj;
    if (!this.value) {
      this.value = '0.00';
    }
  }

  registerOnChange(fn: any): void {
    this.reactiveFormsRegisterOnChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.reactiveFormsRegisterOnTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onBlur() {
    this.reactiveFormsRegisterOnTouched();
    this.commonEvents.emit({
      event: CommonTypeEvent.blur,
      target: this.hostElement.nativeElement,
      value: this.inputChild.nativeElement.value,
    });
  }

  handleFocus() {
    this.commonEvents.emit({
      event: CommonTypeEvent.focus,
      target: this.hostElement.nativeElement,
      value: this.inputChild.nativeElement.value,
    });
  }
}
