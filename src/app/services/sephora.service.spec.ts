import { TestBed } from '@angular/core/testing';

import { SephoraService } from './sephora.service';

describe('SephoraService', () => {
  let service: SephoraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SephoraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
