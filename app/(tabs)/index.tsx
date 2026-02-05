import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  theme,
  getJapaneseDay,
  getFormattedDate,
  getRandomZenQuote,
  formatTime,
} from '../../constants/theme';
import { useTaskContext } from '../../store/TaskContext';
import TagBadge from '../../components/TagBadge';
import WorkMode from '../../components/WorkMode';
import PickTaskModal from '../../components/PickTaskModal';

export default function TodayScreen() {
  const { state, getTask, getTag, completeTask, uncompleteTask, scheduleToday, unscheduleToday } =
    useTaskContext();

  const [workTaskId, setWorkTaskId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [zenQuote] = useState(getRandomZenQuote);

  const todayTasks = useMemo(
    () => state.todayTaskIds.map(id => getTask(id)).filter(Boolean),
    [state.todayTaskIds, state.tasks]
  );

  const completedCount = state.completedToday.length;
  const allCompleted = completedCount === 3 && state.todayTaskIds.length === 3;

  // Fade-in animations for slots
  const slot1Anim = useRef(new Animated.Value(0)).current;
  const slot2Anim = useRef(new Animated.Value(0)).current;
  const slot3Anim = useRef(new Animated.Value(0)).current;
  const slotAnims = [slot1Anim, slot2Anim, slot3Anim];

  useEffect(() => {
    const animations = slotAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 100 + i * 120,
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, []);

  const handlePickTask = (taskId: string) => {
    scheduleToday(taskId);
  };

  const handleToggleComplete = (taskId: string) => {
    if (state.completedToday.includes(taskId)) {
      uncompleteTask(taskId);
    } else {
      completeTask(taskId);
      try {
        const Haptics = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
  };

  const renderTaskSlot = (index: number) => {
    const task = todayTasks[index];
    const anim = slotAnims[index];
    const isCompleted = task ? state.completedToday.includes(task.id) : false;
    const timeSpent = task ? state.timeSpentToday[task.id] || 0 : 0;

    if (!task) {
      // Empty slot
      return (
        <Animated.View
          key={`empty-${index}`}
          style={[
            styles.emptySlot,
            {
              opacity: anim,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            style={styles.emptySlotInner}
            onPress={() => setShowPicker(true)}
          >
            <View style={styles.emptySlotIcon}>
              <Ionicons name="add" size={22} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.emptySlotText}>Choose a focus</Text>
          </Pressable>
        </Animated.View>
      );
    }

    const tags = task.tagIds.map(id => getTag(id)).filter(Boolean);

    return (
      <Animated.View
        key={task.id}
        style={[
          styles.taskCard,
          isCompleted && styles.taskCardCompleted,
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.taskCardInner}>
          {/* Completion toggle */}
          <Pressable
            style={styles.checkButton}
            onPress={() => handleToggleComplete(task.id)}
            hitSlop={8}
          >
            <View
              style={[
                styles.checkCircle,
                isCompleted && styles.checkCircleCompleted,
              ]}
            >
              {isCompleted && (
                <Ionicons name="checkmark" size={14} color="#FFF" />
              )}
            </View>
          </Pressable>

          {/* Task body - tap to work */}
          <Pressable
            style={styles.taskBody}
            onPress={() => !isCompleted && setWorkTaskId(task.id)}
          >
            <Text
              style={[
                styles.taskTitle,
                isCompleted && styles.taskTitleCompleted,
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            <View style={styles.taskMeta}>
              {tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {tags.map(tag => (
                    tag && <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                </View>
              )}
              {timeSpent > 0 && (
                <Text style={styles.timeText}>{formatTime(timeSpent)}</Text>
              )}
            </View>
          </Pressable>

          {/* Remove button */}
          {!isCompleted && (
            <Pressable
              style={styles.removeButton}
              onPress={() => unscheduleToday(task.id)}
              hitSlop={8}
            >
              <Ionicons name="close" size={16} color={theme.colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderProgressDots = () => {
    return (
      <View style={styles.progressContainer}>
        {[0, 1, 2].map(i => {
          const hasTask = i < state.todayTaskIds.length;
          const taskId = state.todayTaskIds[i];
          const isComplete = taskId ? state.completedToday.includes(taskId) : false;
          return (
            <View
              key={i}
              style={[
                styles.progressDot,
                hasTask && styles.progressDotActive,
                isComplete && styles.progressDotComplete,
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.kanjiDay}>{getJapaneseDay()}</Text>
          <Text style={styles.dateText}>{getFormattedDate()}</Text>
        </View>

        {/* Zen quote */}
        <Text style={styles.zenQuote}>{zenQuote}</Text>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>today&apos;s focus</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Task Slots */}
        <View style={styles.slotsContainer}>
          {renderTaskSlot(0)}
          {renderTaskSlot(1)}
          {renderTaskSlot(2)}
        </View>

        {/* Progress */}
        {renderProgressDots()}

        {/* Completion message */}
        {allCompleted && (
          <View style={styles.completionMessage}>
            <Text style={styles.completionEmoji}>&#x2728;</Text>
            <Text style={styles.completionText}>Well done. Rest now.</Text>
          </View>
        )}
      </ScrollView>

      {/* Work Mode */}
      {workTaskId && (
        <WorkMode
          taskId={workTaskId}
          visible={!!workTaskId}
          onClose={() => setWorkTaskId(null)}
        />
      )}

      {/* Pick Task Modal */}
      <PickTaskModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onPickTask={handlePickTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  kanjiDay: {
    fontSize: 48,
    fontWeight: '200',
    color: theme.colors.text,
    marginBottom: 2,
    lineHeight: 56,
  },
  dateText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    letterSpacing: 0.3,
    fontWeight: '400',
  },
  zenQuote: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    marginBottom: theme.spacing.xl,
    lineHeight: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  slotsContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  // Empty slot
  emptySlot: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  emptySlotInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  emptySlotIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: 15,
    color: theme.colors.textTertiary,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  // Task card
  taskCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadow.sm,
  },
  taskCardCompleted: {
    opacity: 0.7,
    borderColor: theme.colors.successSoft,
    backgroundColor: theme.colors.successSoft + '40',
  },
  taskCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  checkButton: {
    padding: 2,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleCompleted: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.textSecondary,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  // Progress dots
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: theme.spacing.lg,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  progressDotActive: {
    backgroundColor: theme.colors.textTertiary,
  },
  progressDotComplete: {
    backgroundColor: theme.colors.success,
  },
  // Completion
  completionMessage: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  completionEmoji: {
    fontSize: 28,
    marginBottom: theme.spacing.sm,
  },
  completionText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '400',
    fontStyle: 'italic',
    letterSpacing: 0.4,
  },
});
