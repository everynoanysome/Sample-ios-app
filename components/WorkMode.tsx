import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, formatTime } from '../constants/theme';
import { useTaskContext } from '../store/TaskContext';
import TagBadge from './TagBadge';

interface WorkModeProps {
  taskId: string;
  visible: boolean;
  onClose: () => void;
}

export default function WorkMode({ taskId, visible, onClose }: WorkModeProps) {
  const { state, getTask, getTag, completeTask, updateTime } = useTaskContext();
  const task = getTask(taskId);
  const isCompleted = state.completedToday.includes(taskId);

  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedTimeRef = useRef<number>(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Initialize elapsed from stored time
  useEffect(() => {
    if (visible) {
      const stored = state.timeSpentToday[taskId] || 0;
      savedTimeRef.current = stored;
      setElapsed(stored);
      setIsRunning(false);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [visible, taskId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - startTimeRef.current) / 1000);
      setElapsed(savedTimeRef.current + diff);
    }, 1000);
  }, []);

  const pauseTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const now = Date.now();
    const diff = Math.floor((now - startTimeRef.current) / 1000);
    savedTimeRef.current = savedTimeRef.current + diff;
    setIsRunning(false);
    updateTime(taskId, savedTimeRef.current);
  }, [taskId, updateTime]);

  const handleComplete = useCallback(() => {
    if (isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const now = Date.now();
      const diff = Math.floor((now - startTimeRef.current) / 1000);
      savedTimeRef.current = savedTimeRef.current + diff;
      setIsRunning(false);
    }
    updateTime(taskId, savedTimeRef.current);
    completeTask(taskId);

    try {
      const Haptics = require('expo-haptics');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setTimeout(() => {
      handleClose();
    }, 600);
  }, [taskId, isRunning, completeTask, updateTime]);

  const handleClose = useCallback(() => {
    if (isRunning) {
      pauseTimer();
    }
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [isRunning, pauseTimer, onClose, fadeAnim]);

  if (!task) return null;

  const tags = task.tagIds.map(id => getTag(id)).filter(Boolean);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={theme.colors.textTertiary} />
          </Pressable>

          {/* Task info */}
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            {tags.length > 0 && (
              <View style={styles.tagsRow}>
                {tags.map(tag => (
                  tag && <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                ))}
              </View>
            )}
          </View>

          {/* Timer */}
          <View style={styles.timerSection}>
            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
            <Text style={styles.timerLabel}>
              {isRunning ? 'focusing...' : elapsed > 0 ? 'paused' : 'ready to begin'}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {!isCompleted && (
              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: isRunning ? theme.colors.surfaceAlt : theme.colors.text },
                ]}
                onPress={isRunning ? pauseTimer : startTimer}
              >
                <Ionicons
                  name={isRunning ? 'pause' : 'play'}
                  size={20}
                  color={isRunning ? theme.colors.text : '#FFF'}
                />
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: isRunning ? theme.colors.text : '#FFF' },
                  ]}
                >
                  {isRunning ? 'Pause' : 'Start'}
                </Text>
              </Pressable>
            )}

            {!isCompleted && (
              <Pressable
                style={[styles.secondaryButton]}
                onPress={handleComplete}
              >
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={styles.secondaryButtonText}>Complete</Text>
              </Pressable>
            )}

            {isCompleted && (
              <View style={styles.completedBanner}>
                <Ionicons name="checkmark-circle" size={28} color={theme.colors.success} />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(248, 247, 244, 0.97)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: theme.spacing.sm,
  },
  taskInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: theme.spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl + 16,
  },
  timerText: {
    fontSize: 72,
    fontWeight: '200',
    color: theme.colors.text,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif-thin' },
    }),
  },
  timerLabel: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.sm,
    letterSpacing: 0.5,
  },
  controls: {
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: theme.radius.full,
    gap: 8,
    minWidth: 180,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: theme.radius.full,
    gap: 8,
    backgroundColor: theme.colors.successSoft,
    minWidth: 180,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.success,
    letterSpacing: 0.3,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  completedText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.success,
  },
});
