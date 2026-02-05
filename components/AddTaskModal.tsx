import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, generateId } from '../constants/theme';
import { useTaskContext } from '../store/TaskContext';
import TagBadge from './TagBadge';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onTaskAdded?: (taskId: string) => void;
}

export default function AddTaskModal({ visible, onClose, onTaskAdded }: AddTaskModalProps) {
  const { state, addTask, addTag } = useTaskContext();
  const [title, setTitle] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const titleInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      setTitle('');
      setSelectedTagIds([]);
      setShowNewTag(false);
      setNewTagName('');
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
      ]).start(() => {
        titleInputRef.current?.focus();
      });
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

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    const colorIndex = state.tags.length % theme.colors.tagColors.length;
    const newTag = addTag(newTagName.trim(), theme.colors.tagColors[colorIndex]);
    setSelectedTagIds(prev => [...prev, newTag.id]);
    setNewTagName('');
    setShowNewTag(false);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const task = addTask(title.trim(), selectedTagIds);
    try {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (onTaskAdded) {
      onTaskAdded(task.id);
    }
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Task</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.colors.textTertiary} />
            </Pressable>
          </View>

          {/* Title input */}
          <TextInput
            ref={titleInputRef}
            style={styles.input}
            placeholder="What will you focus on?"
            placeholderTextColor={theme.colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            returnKeyType="done"
            onSubmitEditing={title.trim() ? handleSubmit : undefined}
            maxLength={100}
          />

          {/* Tags */}
          <Text style={styles.sectionLabel}>Tags</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsContainer}
          >
            {state.tags.map(tag => (
              <TagBadge
                key={tag.id}
                name={tag.name}
                color={tag.color}
                size="md"
                selected={selectedTagIds.includes(tag.id)}
                onPress={() => toggleTag(tag.id)}
              />
            ))}
            <Pressable
              style={styles.addTagButton}
              onPress={() => setShowNewTag(true)}
            >
              <Ionicons name="add" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.addTagText}>New</Text>
            </Pressable>
          </ScrollView>

          {/* New tag input */}
          {showNewTag && (
            <View style={styles.newTagRow}>
              <TextInput
                style={styles.newTagInput}
                placeholder="Tag name"
                placeholderTextColor={theme.colors.textTertiary}
                value={newTagName}
                onChangeText={setNewTagName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreateTag}
                maxLength={20}
              />
              <Pressable
                style={[
                  styles.newTagConfirm,
                  { opacity: newTagName.trim() ? 1 : 0.4 },
                ]}
                onPress={handleCreateTag}
                disabled={!newTagName.trim()}
              >
                <Ionicons name="checkmark" size={18} color={theme.colors.accent} />
              </Pressable>
            </View>
          )}

          {/* Submit */}
          <Pressable
            style={[
              styles.submitButton,
              { opacity: title.trim() ? 1 : 0.4 },
            ]}
            onPress={handleSubmit}
            disabled={!title.trim()}
          >
            <Text style={styles.submitText}>Add Task</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
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
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  input: {
    fontSize: 17,
    color: theme.colors.text,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.colors.border,
    paddingVertical: 12,
    marginBottom: theme.spacing.lg,
    letterSpacing: -0.2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: theme.spacing.md,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  addTagText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  newTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  newTagInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 8,
  },
  newTagConfirm: {
    padding: theme.spacing.sm,
  },
  submitButton: {
    backgroundColor: theme.colors.text,
    paddingVertical: 16,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.3,
  },
});
