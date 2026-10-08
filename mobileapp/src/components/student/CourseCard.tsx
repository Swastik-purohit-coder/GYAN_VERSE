import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BookOpen, CheckCircle, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  category?: string;
  totalLessons: number;
  completedLessons: number;
  onPress: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  title,
  description,
  category = 'General',
  totalLessons,
  completedLessons,
  onPress,
}) => {
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isCompleted = progressPercent === 100;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <Badge label={category} variant="primary" size="sm" />
        <View style={styles.lessonCountBadge}>
          <BookOpen size={12} color={colors.text.secondary} />
          <Text style={styles.lessonCountText}>
            {completedLessons}/{totalLessons} Lessons
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%` },
              isCompleted && styles.progressComplete,
            ]}
          />
        </View>
        <Text style={styles.progressText}>{progressPercent}%</Text>
      </View>

      <View style={styles.footerRow}>
        {isCompleted ? (
          <View style={styles.completedTag}>
            <CheckCircle size={14} color={colors.success.main} />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        ) : (
          <Text style={styles.continueText}>Continue Learning</Text>
        )}
        <ChevronRight size={16} color={colors.primary.light} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  lessonCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonCountText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surface.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: radii.full,
  },
  progressComplete: {
    backgroundColor: colors.success.main,
  },
  progressText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    width: 34,
    textAlign: 'right',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
    paddingTop: spacing.sm,
  },
  continueText: {
    ...typography.caption,
    color: colors.primary.light,
    fontWeight: '600',
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    ...typography.caption,
    color: colors.success.main,
    fontWeight: '600',
  },
});
