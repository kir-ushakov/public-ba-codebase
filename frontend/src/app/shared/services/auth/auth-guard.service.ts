import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserState } from '../../state/user.state';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService {
  constructor(
    private router: Router,
    private store: Store,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.redirectIfNotLoggedIn();
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.redirectIfNotLoggedIn();
  }

  private redirectIfNotLoggedIn(): boolean {
    if (!this.isLoggedIn()) {
      this.router.navigateByUrl('login');
      return false;
    } else {
      return true;
    }
  }

  private isLoggedIn(): boolean {
    return this.store.selectSnapshot(UserState.isLoggedIn);
  }
}
