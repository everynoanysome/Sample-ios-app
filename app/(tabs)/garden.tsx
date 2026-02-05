import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SectionList,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme, formatTime } from '../../constants/theme';
import { useTaskContext } from '../../store/TaskContext';
import { Task } from '../../types';
import TagBadge from '../../components/TagBadge';
import AddTaskModal from '../../components/AddTaskModal';

interface SectionData {
  title: string;
  subtitle?: string;
  data: Task[];
}

export default function GardenScreen() {
  const {
    state,
    getTask,
    getTag,
    getUnscheduledTasks,
    scheduleTomorrow,
    unscheduleTomorrow,
    scheduleToday,
    deleteTask,
  } = useTaskContext();

  const [showAddTask, setShowAddTask] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const tomorrowTasks = state.tomorrowTaskIds
    .map(id => getTask(id))
    .filter(Boolean) as Task[];

  const unscheduledTasks = getUnscheduledTasks();

  const sections: SectionData[] = [];

  if (tomorrowTasks.length > 0) {
    sections.push({
      title: 'Tomorrow',
      subtitle: `${tomorrowTasks.length} of 3`,
      data: tomorrowTasks,
    });
  }

  sections.push({
    title: 'All Tasks',
    subtitle: `${unscheduledTasks.length} task${unscheduledTasks.length !== 1 ? 's' : ''}`,
    data: unscheduledTasks,
  });

  const handleDeleteTask = (task: Task) => {
    if (Platform.OS === 'web') {
      deleteTask(task.id);
      return;
    }
    Alert.alert(
      'Remove Task',
      `Remove "${task.title}" from your garden?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteTask(task.id),
        },
      ]
    );
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.subtitle && (
        <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      )}
    </View>
  );

  const renderTask = ({ item, section }: { item: Task; section: SectionData }) => {
    const tags = item.tagIds.map(id => getTag(id)).filter(Boolean);
    const isTomorrow = section.title === 'Tomorrow';
    const isScheduledToday = state.todayTaskIds.includes(item.id);
    const canScheduleTomorrow = state.tomorrowTaskIds.length < 3;
    const canScheduleToday = state.todayTaskIds.length < 3;

    return (
      <Animated.View style={[styles.taskCard, { opacity: fadeAnim }]}>
        <View style={styles.taskContent}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map(tag => (
                tag && <TagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.taskActions}>
          {isTomorrow ? (
            <Pressable
              style={styles.actionButton}
              onPress={() => unscheduleTomorrow(item.id)}
              hitSlop={8}
            >
              <Ionicons name="close-circle-outline" size={20} color={theme.colors.textTertiary} />
            </Pressable>
          ) : (
            <View style={styles.actionRow}>
              {canScheduleToday && !isScheduledToday && (
                <Pressable
                  style={[styles.scheduleButton, styles.todayButton]}
                  onPress={() => {
                    scheduleToday(item.id);
                    try {
                      const Haptics = require('expo-haptics');
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                  }}
                >
                  <Text style={styles.todayButtonText}>Today</Text>
                </Pressable>
              )}
              {canScheduleTomorrow && (
                <Pressable
                  style={styles.scheduleButton}
                  onPress={() => {
                    scheduleTomorrow(item.id);
                    try {
                      const Haptics = require('expo-haptics');
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                  }}
                >
                  <Ionicons name="arrow-forward" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.scheduleButtonText}>Tomorrow</Text>
                </Pressable>
              )}
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDeleteTask(item)}
                hitSlop={6}
              >
                <Ionicons name="trash-outline" size={16} color={theme.colors.textTertiary} />
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="leaf-outline" size={36} color={theme.colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>Your garden is empty</Text>
      <Text style={styles.emptySubtitle}>
        Plant the seeds of your intentions.{'\n'}
        Add tasks to nurture your focus.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Garden</Text>
          <Text style={styles.headerSubtitle}>Nurture your intentions</Text>
        </View>
      </View>

      {/* Task List */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderTask}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
        onPress={() => setShowAddTask(true)}
      >
        <Ionicons name="add" size={26} color="#FFF" />
      </Pressable>

      {/* Add Task Modal */}
      <AddTaskModal
        visible={showAddTask}
        onClose={() => setShowAddTask(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontWeight: '500',
  },
  taskCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadow.sm,
  },
  taskContent: {
    marginBottom: theme.spacing.sm,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  taskActions: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingTop: theme.spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 2,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceAlt,
  },
  scheduleButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  todayButton: {
    backgroundColor: theme.colors.accentSoft,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  deleteButton: {
    marginLeft: 'auto',
    padding: 6,
  },
  separator: {
    height: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 24,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.md,
  },
});
