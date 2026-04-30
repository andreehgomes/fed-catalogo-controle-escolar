import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appInputMask]',
  standalone: false,
})
export class InputMaskDirective {
  @Input() appInputMask: string = '';

  constructor(private el: ElementRef, private control: NgControl) {}

  @HostListener('input')
  onInput() {
    const raw = this.el.nativeElement.value.replace(/\D/g, '');
    const masked = this.applyMask(raw, this.appInputMask);
    this.el.nativeElement.value = masked;
    this.control.control?.setValue(masked, { emitEvent: false });
  }

  private applyMask(raw: string, mask: string): string {
    let result = '';
    let rawIndex = 0;
    for (let i = 0; i < mask.length && rawIndex < raw.length; i++) {
      if (mask[i] === '0') {
        result += raw[rawIndex++];
      } else {
        result += mask[i];
      }
    }
    return result;
  }
}
