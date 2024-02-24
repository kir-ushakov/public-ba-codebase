import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DtHomeScreenComponent } from './dt-home-screencomponent';

describe('HomeScreenComponent', () => {
  let component: DtHomeScreenComponent;
  let fixture: ComponentFixture<DtHomeScreenComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DtHomeScreenComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DtHomeScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
