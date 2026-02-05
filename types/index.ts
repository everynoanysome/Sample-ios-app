export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  tagIds: string[];
  createdAt: number;
}

export interface AppState {
  tasks: Task[];
  tags: Tag[];
  todayDate: string;
  todayTaskIds: string[];
  tomorrowTaskIds: string[];
  completedToday: string[];
  timeSpentToday: Record<string, number>;
}

export type Action =
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'EDIT_TASK'; taskId: string; title: string; tagIds: string[] }
  | { type: 'ADD_TAG'; tag: Tag }
  | { type: 'SCHEDULE_TODAY'; taskId: string }
  | { type: 'UNSCHEDULE_TODAY'; taskId: string }
  | { type: 'SCHEDULE_TOMORROW'; taskId: string }
  | { type: 'UNSCHEDULE_TOMORROW'; taskId: string }
  | { type: 'COMPLETE_TASK'; taskId: string }
  | { type: 'UNCOMPLETE_TASK'; taskId: string }
  | { type: 'UPDATE_TIME'; taskId: string; seconds: number }
  | { type: 'NEW_DAY' }
  | { type: 'LOAD_STATE'; state: AppState };
