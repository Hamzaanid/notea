import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListParfums } from './list-parfums';

describe('ListParfums', () => {
  let component: ListParfums;
  let fixture: ComponentFixture<ListParfums>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListParfums]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListParfums);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
