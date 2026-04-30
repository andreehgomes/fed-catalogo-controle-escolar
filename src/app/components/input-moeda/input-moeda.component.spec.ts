import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputMoedaComponent } from './input-moeda.component';

describe('InputMoedaComponent', () => {
  let component: InputMoedaComponent;
  let fixture: ComponentFixture<InputMoedaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InputMoedaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InputMoedaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
