import { Component, ViewChild, ElementRef, Input } from '@angular/core';
import { IUserAvatarInputData } from './user-avatar.interface';

@Component({
  selector: 'ba-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
})
export class UserAvatarComponent {
  @Input() data: IUserAvatarInputData;
  @ViewChild('avatarHolder') avatarHolderRef: ElementRef;

  constructor(private _el: ElementRef) {}

  ngAfterViewInit(): void {
    this.setAvatarProperties();
    this.fitLetterSizeToCont();
  }

  private fitLetterSizeToCont() {
    if (this.avatarHolderRef) {
      const elHeight = this._el.nativeElement.offsetHeight;
      this.avatarHolderRef.nativeElement.style.fontSize = elHeight * 0.75 + 'px';
    }
  }

  private setAvatarProperties() {
    if (this.data.photoUrl) {
      this.avatarHolderRef.nativeElement.style.backgroundImage = `url(${this.data.photoUrl})`;
    } else {
      this.avatarHolderRef.nativeElement.innerHTML = this.data.firstLetter;
      if (this.data.color) {
        this.avatarHolderRef.nativeElement.style.background = this.data.color;
      }
    }
  }
}
