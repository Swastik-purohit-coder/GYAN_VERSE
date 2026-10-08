import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cloud, CloudOff, RefreshCw, Check } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { SYNC_STATUS, SyncStatusType } from '../../../../shared/constants';

export interface SyncStatusBadgeProps {
  status: SyncStatusType;
  label?: string;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ status, label }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case SYNC_STATUS.SYNCING:
        return {
          icon: <RefreshCw size={12} color={colors.sync.syncing} />,
          text: label || 'Syncing',
          bg: '#0284C720',
          border: colors.sync.syncing,
          color: colors.sync.syncing,
        };
      case SYNC_STATUS.SYNCED:
        return {
          icon: <Check size={12} color={colors.sync.synced} />,
          text: label || 'Synced',
          bg: '#05966920',
          border: colors.sync.synced,
          color: colors.sync.synced,
        };
      case SYNC_STATUS.OFFLINE:
        return {
          icon: <CloudOff size={12} color={colors.warning.light} />,
          text: label || 'Offline Cache',
          bg: '#D9770620',
          border: colors.warning.main,
          color: colors.warning.light,
        };
      case SYNC_STATUS.ERROR:
        return {
          icon: <CloudOff size={12} color={colors.sync.error} />,
          text: label || 'Sync Failed',
          bg: '#DC262620',
          border: colors.sync.error,
          color: colors.sync.error,
        };
      case SYNC_STATUS.IDLE:
      default:
        return {
          icon: <Cloud size={12} color={colors.text.muted} />,
          text: label || 'Cloud Ready',
          bg: '#33415520',
          border: colors.surface.border,
          color: colors.text.muted,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bg, borderColor: config.border },
      ]}
    >
      {config.icon}
      <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    gap: 4,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
});
