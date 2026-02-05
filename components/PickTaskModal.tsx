import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { useTaskContext } from '../store/TaskContext';
import { Task } from '../types';
import TagBadge from './TagBadge';

interface PickTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onPickTask: (taskId: string) => void;
  title?: string;
  excludeIds?: string[];
}

export default function PickTaskModal({
  visible,
  onClose,
  onPickTask,
  title = 'Choose a focus',
  excludeIds = [],
}: PickTaskModalProps) {
  const { state, getTag, getUnscheduledTasks } = useTaskContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  const availableTasks = getUnscheduledTasks().filter(
    t => !excludeIds.includes(t.id)
  );

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(100);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handlePick = (taskId: string) => {
    try {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPickTask(taskId);
    handleClose();
  };

  const renderTask = ({ item }: { item: Task }) => {
    const tags = item.tagIds.map(id => getTag(id)).filter(Boolean);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.taskItem,
          pressed && { backgroundColor: theme.colors.surfaceAlt },
        ]}
        onPress={() => handlePick(item.id)}
      >
        <View style={styles.taskContent}>
          <Text style={styles.taskTitle} numberOfLines={1}>
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
        <Ionicons name="add-circle-outline" size={22} color={theme.colors.textTertiary} />
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.wrapper}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.colors.textTertiary} />
            </Pressable>
          </View>

          {availableTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={40} color={theme.colors.border} />
              <Text style={styles.emptyText}>No tasks in your garden yet</Text>
              <Text style={styles.emptySubtext}>Add tasks from the Garden tab</Text>
            </View>
          ) : (
            <FlatList
              data={availableTasks}
              keyExtractor={item => item.id}
              renderItem={renderTask}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : theme.spacing.lg,
    maxHeight: '70%',
    ...theme.shadow.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  list: {
    marginBottom: theme.spacing.md,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: theme.radius.md,
  },
  taskContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
});
