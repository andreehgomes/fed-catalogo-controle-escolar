import { TestBed } from '@angular/core/testing';

import { OnloadService } from './onload.service';

describe('OnloadService', () => {
  let service: OnloadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OnloadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
