import { TestBed } from "@angular/core/testing";

import { RedefirSenhaService } from "./redefine-password.service";

describe("RedefirSenhaService", () => {
  let service: RedefirSenhaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RedefirSenhaService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
