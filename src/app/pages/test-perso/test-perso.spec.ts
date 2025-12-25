import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestPerso } from './test-perso';

describe('TestPerso', () => {
  let component: TestPerso;
  let fixture: ComponentFixture<TestPerso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestPerso]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestPerso);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
