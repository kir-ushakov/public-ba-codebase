import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DtProfileScreenComponent } from './dt-profile-screen.component';

describe('DtProfileScreenComponent', () => {
  let component: DtProfileScreenComponent;
  let fixture: ComponentFixture<DtProfileScreenComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DtProfileScreenComponent]
    });
    fixture = TestBed.createComponent(DtProfileScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
