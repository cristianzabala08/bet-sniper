import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyNetworkComponent } from './my-network.component';

describe('MyNetworkComponent', () => {
  let component: MyNetworkComponent;
  let fixture: ComponentFixture<MyNetworkComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyNetworkComponent]
    });
    fixture = TestBed.createComponent(MyNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
