import { FormControl } from '@angular/forms';

export type FormControlsOf<T> = {
  [K in keyof T]: FormControl<T[K]>;
};
