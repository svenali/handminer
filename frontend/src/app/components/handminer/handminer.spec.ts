import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Handminer } from './handminer';

describe('Handminer', () => {
  let component: Handminer;
  let fixture: ComponentFixture<Handminer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Handminer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Handminer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
