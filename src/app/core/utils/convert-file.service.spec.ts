import { TestBed } from '@angular/core/testing';

import { ConvertFileService } from './convert-file.service';

describe('ConvertFileService', () => {
  let service: ConvertFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConvertFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
