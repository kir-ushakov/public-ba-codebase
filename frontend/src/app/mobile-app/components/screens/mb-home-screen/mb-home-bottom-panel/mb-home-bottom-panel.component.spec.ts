import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgxsModule } from '@ngxs/store';

import { MbHomeBottomPanelComponent } from './mb-home-bottom-panel.component';

describe('BottomButtonsPanelComponent', () => {
  let component: MbHomeBottomPanelComponent;
  let fixture: ComponentFixture<MbHomeBottomPanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([])],
      declarations: [MbHomeBottomPanelComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MbHomeBottomPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
