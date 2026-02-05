import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Action, Task, Tag } from '../types';
import { getTodayDate, DEFAULT_TAGS, generateId } from '../constants/theme';

const STORAGE_KEY = '@ikigai_state';

const initialState: AppState = {
  tasks: [],
  tags: DEFAULT_TAGS,
  todayDate: getTodayDate(),
  todayTaskIds: [],
  tomorrowTaskIds: [],
  completedToday: [],
  timeSpentToday: {},
};

function taskReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.task] };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.taskId),
        todayTaskIds: state.todayTaskIds.filter(id => id !== action.taskId),
        tomorrowTaskIds: state.tomorrowTaskIds.filter(id => id !== action.taskId),
        completedToday: state.completedToday.filter(id => id !== action.taskId),
      };

    case 'EDIT_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.taskId
            ? { ...t, title: action.title, tagIds: action.tagIds }
            : t
        ),
      };

    case 'ADD_TAG':
      return { ...state, tags: [...state.tags, action.tag] };

    case 'SCHEDULE_TODAY':
      if (state.todayTaskIds.length >= 3) return state;
      if (state.todayTaskIds.includes(action.taskId)) return state;
      return {
        ...state,
        todayTaskIds: [...state.todayTaskIds, action.taskId],
        tomorrowTaskIds: state.tomorrowTaskIds.filter(id => id !== action.taskId),
      };

    case 'UNSCHEDULE_TODAY':
      return {
        ...state,
        todayTaskIds: state.todayTaskIds.filter(id => id !== action.taskId),
      };

    case 'SCHEDULE_TOMORROW':
      if (state.tomorrowTaskIds.length >= 3) return state;
      if (state.tomorrowTaskIds.includes(action.taskId)) return state;
      return {
        ...state,
        tomorrowTaskIds: [...state.tomorrowTaskIds, action.taskId],
        todayTaskIds: state.todayTaskIds.filter(id => id !== action.taskId),
      };

    case 'UNSCHEDULE_TOMORROW':
      return {
        ...state,
        tomorrowTaskIds: state.tomorrowTaskIds.filter(id => id !== action.taskId),
      };

    case 'COMPLETE_TASK':
      if (state.completedToday.includes(action.taskId)) return state;
      return {
        ...state,
        completedToday: [...state.completedToday, action.taskId],
      };

    case 'UNCOMPLETE_TASK':
      return {
        ...state,
        completedToday: state.completedToday.filter(id => id !== action.taskId),
      };

    case 'UPDATE_TIME':
      return {
        ...state,
        timeSpentToday: {
          ...state.timeSpentToday,
          [action.taskId]: action.seconds,
        },
      };

    case 'NEW_DAY':
      return {
        ...state,
        todayDate: getTodayDate(),
        todayTaskIds: state.tomorrowTaskIds.slice(0, 3),
        tomorrowTaskIds: [],
        completedToday: [],
        timeSpentToday: {},
      };

    case 'LOAD_STATE':
      return action.state;

    default:
      return state;
  }
}

interface TaskContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addTask: (title: string, tagIds: string[]) => Task;
  deleteTask: (taskId: string) => void;
  scheduleToday: (taskId: string) => void;
  unscheduleToday: (taskId: string) => void;
  scheduleTomorrow: (taskId: string) => void;
  unscheduleTomorrow: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  uncompleteTask: (taskId: string) => void;
  updateTime: (taskId: string, seconds: number) => void;
  addTag: (name: string, color: string) => Tag;
  getTask: (taskId: string) => Task | undefined;
  getTag: (tagId: string) => Tag | undefined;
  getUnscheduledTasks: () => Task[];
  isLoaded: boolean;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const isLoadedRef = useRef(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load state from storage on mount
  useEffect(() => {
    loadState();
  }, []);

  // Save state to storage on changes (after initial load)
  useEffect(() => {
    if (isLoadedRef.current) {
      saveState(state);
    }
  }, [state]);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AppState = JSON.parse(stored);
        // Check if day has changed
        const today = getTodayDate();
        if (parsed.todayDate !== today) {
          // Day transition: tomorrow's tasks become today's
          const newState: AppState = {
            ...parsed,
            todayDate: today,
            todayTaskIds: parsed.tomorrowTaskIds.slice(0, 3),
            tomorrowTaskIds: [],
            completedToday: [],
            timeSpentToday: {},
          };
          dispatch({ type: 'LOAD_STATE', state: newState });
        } else {
          dispatch({ type: 'LOAD_STATE', state: parsed });
        }
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
    isLoadedRef.current = true;
    setIsLoaded(true);
  };

  const saveState = async (s: AppState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  };

  const addTask = useCallback((title: string, tagIds: string[]): Task => {
    const task: Task = {
      id: generateId(),
      title,
      tagIds,
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_TASK', task });
    return task;
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    dispatch({ type: 'DELETE_TASK', taskId });
  }, []);

  const scheduleToday = useCallback((taskId: string) => {
    dispatch({ type: 'SCHEDULE_TODAY', taskId });
  }, []);

  const unscheduleToday = useCallback((taskId: string) => {
    dispatch({ type: 'UNSCHEDULE_TODAY', taskId });
  }, []);

  const scheduleTomorrow = useCallback((taskId: string) => {
    dispatch({ type: 'SCHEDULE_TOMORROW', taskId });
  }, []);

  const unscheduleTomorrow = useCallback((taskId: string) => {
    dispatch({ type: 'UNSCHEDULE_TOMORROW', taskId });
  }, []);

  const completeTask = useCallback((taskId: string) => {
    dispatch({ type: 'COMPLETE_TASK', taskId });
  }, []);

  const uncompleteTask = useCallback((taskId: string) => {
    dispatch({ type: 'UNCOMPLETE_TASK', taskId });
  }, []);

  const updateTime = useCallback((taskId: string, seconds: number) => {
    dispatch({ type: 'UPDATE_TIME', taskId, seconds });
  }, []);

  const addTag = useCallback((name: string, color: string): Tag => {
    const tag: Tag = { id: generateId(), name, color };
    dispatch({ type: 'ADD_TAG', tag });
    return tag;
  }, []);

  const getTask = useCallback(
    (taskId: string) => state.tasks.find(t => t.id === taskId),
    [state.tasks]
  );

  const getTag = useCallback(
    (tagId: string) => state.tags.find(t => t.id === tagId),
    [state.tags]
  );

  const getUnscheduledTasks = useCallback(() => {
    const scheduled = new Set([...state.todayTaskIds, ...state.tomorrowTaskIds]);
    return state.tasks.filter(t => !scheduled.has(t.id));
  }, [state.tasks, state.todayTaskIds, state.tomorrowTaskIds]);

  return (
    <TaskContext.Provider
      value={{
        state,
        dispatch,
        addTask,
        deleteTask,
        scheduleToday,
        unscheduleToday,
        scheduleTomorrow,
        unscheduleTomorrow,
        completeTask,
        uncompleteTask,
        updateTime,
        addTag,
        getTask,
        getTag,
        getUnscheduledTasks,
        isLoaded,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext(): TaskContextType {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}
