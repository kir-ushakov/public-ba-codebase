import { Pipe, PipeTransform } from '@angular/core';
import {
  formatTaskTileDate,
  TASK_TILE_DATE_LOCALE,
} from './helpers/format-task-tile-date.function';

@Pipe({
  name: 'taskTileDate',
  pure: true,
})
export class TaskTileDatePipe implements PipeTransform {
  transform(createdAt: string, dayKey: string, locale = TASK_TILE_DATE_LOCALE): string {
    // dayKey is a pure-pipe input so the label refreshes on the next local day.
    void dayKey;
    return formatTaskTileDate(createdAt, new Date(), locale);
  }
}
