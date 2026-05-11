import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveSignalsComponent } from './active-signals.component';

describe('ActiveSignalsComponent', () => {
  let component: ActiveSignalsComponent;
  let fixture: ComponentFixture<ActiveSignalsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActiveSignalsComponent]
    });
    fixture = TestBed.createComponent(ActiveSignalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
