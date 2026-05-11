import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlansSelectionComponent } from './plans-selection.component';

describe('PlansSelectionComponent', () => {
  let component: PlansSelectionComponent;
  let fixture: ComponentFixture<PlansSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlansSelectionComponent]
    });
    fixture = TestBed.createComponent(PlansSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
