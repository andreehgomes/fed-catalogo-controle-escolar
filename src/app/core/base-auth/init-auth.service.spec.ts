import { TestBed } from '@angular/core/testing';

import { InitAuthService } from './init-auth.service';

describe('InitAuthService', () => {
  let service: InitAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InitAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
