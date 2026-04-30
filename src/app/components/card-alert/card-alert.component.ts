import { Component, OnInit, Input } from '@angular/core';
import { AlertasType } from 'src/app/shared/model/alertas-type.enum';

@Component({
    selector: 'card-alert',
    templateUrl: './card-alert.component.html',
    styleUrls: ['./card-alert.component.scss'],
    standalone: false
})
export class CardAlertComponent implements OnInit {

  @Input() tipo: AlertasType;
  @Input() codigo;
  @Input() mensagem;

  constructor() { }

  ngOnInit(): void {}

}
