import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, CheckCircle, Zap } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { Card } from '../common/Card';

export interface StreakCardProps {
  streakCount: number;
  xpPoints?: number;
  completedToday?: boolean;
  todayGoalText?: string;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  streakCount,
  xpPoints = 120,
  completedToday = true,
  todayGoalText = 'Daily Goal: Complete 1 Lesson or Quiz',
}) => {
  return (
    <Card variant="highlight" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.flameBadge}>
          <Flame size={28} color="#F59E0B" fill="#F59E0B" />
          <View>
            <Text style={styles.streakNumber}>{streakCount}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.xpContainer}>
          <Zap size={16} color="#38BDF8" fill="#38BDF8" />
          <Text style={styles.xpText}>{xpPoints} XP</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statusRow}>
        {completedToday ? (
          <CheckCircle size={18} color={colors.success.main} />
        ) : (
          <View style={styles.pendingDot} />
        )}
        <Text style={styles.goalText}>
          {completedToday ? "Today's goal completed! Keep the fire burning!" : todayGoalText}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderColor: '#4F46E5',
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  streakNumber: {
    ...typography.h2,
    color: '#F59E0B',
    fontWeight: '800',
  },
  streakLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0369A130',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#0284C7',
    gap: 4,
  },
  xpText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#38BDF8',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface.border,
    marginVertical: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    flex: 1,
  },
  pendingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.warning.main,
  },
});
