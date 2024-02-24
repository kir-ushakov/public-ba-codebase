import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddToSlackRedirectComponent } from './add-to-slack-redirect.component';

describe('AddToSlackRedirectComponent', () => {
  let component: AddToSlackRedirectComponent;
  let fixture: ComponentFixture<AddToSlackRedirectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddToSlackRedirectComponent],
    });
    fixture = TestBed.createComponent(AddToSlackRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
