import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveClaims } from './approve-claims';

describe('ApproveClaims', () => {
  let component: ApproveClaims;
  let fixture: ComponentFixture<ApproveClaims>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApproveClaims],
    }).compileComponents();

    fixture = TestBed.createComponent(ApproveClaims);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
