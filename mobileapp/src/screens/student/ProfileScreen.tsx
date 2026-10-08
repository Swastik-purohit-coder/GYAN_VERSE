import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import {
  User,
  Flame,
  Award,
  RefreshCw,
  HardDrive,
  Wifi,
  Moon,
  LogOut,
  Shield,
  CheckCircle,
} from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { Card, Button, Badge } from '../../components/common';
import { useAppStore } from '../../store/useAppStore';
import { SYNC_STATUS } from '../../../../shared/constants';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    user,
    isOffline,
    pendingSyncCount,
    isSyncing,
    syncStatus,
    setSyncStatus,
    lowDataMode,
    setLowDataMode,
  } = useAppStore();

  const handleManualSync = () => {
    setSyncStatus(SYNC_STATUS.SYNCING);
    setTimeout(() => {
      setSyncStatus(SYNC_STATUS.SYNCED, 0);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Card */}
        <Card variant="highlight" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User size={32} color="#FFFFFF" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.fullName || 'Arjun Sharma'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'student@gyanverse.edu'}</Text>
              <Badge label="Grade 10 • Computer Science & Math" variant="primary" size="sm" />
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Flame size={20} color="#F59E0B" />
              <Text style={styles.statNumber}>{user?.streakCount || 5} Days</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Award size={20} color="#38BDF8" />
              <Text style={styles.statNumber}>{user?.xpPoints || 340} XP</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <CheckCircle size={20} color={colors.success.main} />
              <Text style={styles.statNumber}>14</Text>
              <Text style={styles.statLabel}>Lessons Done</Text>
            </View>
          </View>
        </Card>

        {/* Offline & Synchronization Settings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Offline & Sync Engine</Text>
        </View>

        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextWrapper}>
              <Text style={styles.settingLabel}>Pending Sync Queue</Text>
              <Text style={styles.settingDescription}>
                {pendingSyncCount > 0
                  ? `${pendingSyncCount} operations queued locally`
                  : 'All local changes synchronized'}
              </Text>
            </View>
            <Button
              title={isSyncing ? 'Syncing...' : 'Sync Now'}
              variant="outline"
              size="sm"
              loading={isSyncing}
              leftIcon={<RefreshCw size={14} color={colors.primary.light} style={{ marginRight: 4 }} />}
              onPress={handleManualSync}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingTextWrapper}>
              <Text style={styles.settingLabel}>Low-Data & Low-RAM Mode</Text>
              <Text style={styles.settingDescription}>
                Streams ultra-compact 240p/360p chunks to save battery and data.
              </Text>
            </View>
            <Switch
              value={lowDataMode}
              onValueChange={setLowDataMode}
              trackColor={{ false: colors.surface.border, true: colors.primary.main }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Account Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account</Text>
        </View>

        <Button
          title="Sign Out"
          variant="danger"
          size="md"
          leftIcon={<LogOut size={16} color="#FFFFFF" style={{ marginRight: 8 }} />}
          onPress={() => navigation.navigate('Auth', { screen: 'Welcome' })}
          style={styles.signOutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxxl,
  },
  profileCard: {
    backgroundColor: colors.surface.card,
    borderColor: colors.primary.main,
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  profileEmail: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
    paddingTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.surface.border,
  },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '700',
  },
  settingsCard: {
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  settingTextWrapper: {
    flex: 1,
    paddingRight: spacing.md,
  },
  settingLabel: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface.border,
    marginVertical: spacing.md,
  },
  signOutButton: {
    marginTop: spacing.sm,
  },
});
