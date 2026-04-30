import { TestBed } from '@angular/core/testing';

import { PageErrorService } from './page-error.service';

describe('PageErrorService', () => {
  let service: PageErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PageErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
