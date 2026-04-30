import { TestBed } from '@angular/core/testing';

import { ConfigFirebaseService } from './config-firebase.service';

describe('ConfigFirebaseService', () => {
  let service: ConfigFirebaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigFirebaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
