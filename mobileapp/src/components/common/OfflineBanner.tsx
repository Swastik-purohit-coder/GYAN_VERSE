import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';

export interface OfflineBannerProps {
  isOffline: boolean;
  pendingSyncCount?: number;
  isSyncing?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOffline,
  pendingSyncCount = 0,
  isSyncing = false,
}) => {
  if (!isOffline && pendingSyncCount === 0 && !isSyncing) {
    return null;
  }

  if (isSyncing) {
    return (
      <View style={[styles.container, styles.syncing]}>
        <RefreshCw size={16} color="#FFFFFF" />
        <Text style={styles.text}>Syncing local changes with GyanVerse cloud...</Text>
      </View>
    );
  }

  if (isOffline) {
    return (
      <View style={[styles.container, styles.offline]}>
        <WifiOff size={16} color="#FFFFFF" />
        <Text style={styles.text}>
          Offline Mode • {pendingSyncCount > 0 ? `${pendingSyncCount} changes queued` : 'Using downloaded library'}
        </Text>
      </View>
    );
  }

  if (pendingSyncCount > 0) {
    return (
      <View style={[styles.container, styles.pending]}>
        <RefreshCw size={16} color="#FFFFFF" />
        <Text style={styles.text}>
          Online • {pendingSyncCount} offline action(s) ready to sync
        </Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  offline: {
    backgroundColor: colors.warning.dark,
  },
  syncing: {
    backgroundColor: colors.primary.main,
  },
  pending: {
    backgroundColor: colors.secondary.dark,
  },
  text: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
