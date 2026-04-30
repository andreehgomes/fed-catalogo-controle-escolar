import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAlertComponent } from './card-alert.component';

describe('CardAlertComponent', () => {
  let component: CardAlertComponent;
  let fixture: ComponentFixture<CardAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardAlertComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
