import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
} from 'react-native';
import {
  HardDrive,
  Trash2,
  PlayCircle,
  Volume2,
  CheckCircle2,
  WifiOff,
} from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { Card, Button, Badge } from '../../components/common';
import { MEDIA_TYPES, DOWNLOAD_STATUS } from '../../../../shared/constants';

export const DownloadsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [downloadedItems, setDownloadedItems] = useState([
    {
      id: 'lesson-1',
      title: 'Time Complexity & Big-O Notation',
      subject: 'Computer Science',
      mediaType: MEDIA_TYPES.VIDEO,
      fileSizeBytes: 8400000, // 8.4 MB
      downloadedAt: 'Today, 2:30 PM',
    },
    {
      id: 'lesson-2',
      title: 'Algebraic Polynomials & Factoring',
      subject: 'Mathematics',
      mediaType: MEDIA_TYPES.VIDEO,
      fileSizeBytes: 12100000, // 12.1 MB
      downloadedAt: 'Yesterday',
    },
    {
      id: 'lesson-audio-1',
      title: 'Audio Lecture: Recursion & Stack Frames',
      subject: 'Computer Science',
      mediaType: MEDIA_TYPES.AUDIO,
      fileSizeBytes: 3200000, // 3.2 MB
      downloadedAt: '2 days ago',
    },
  ]);

  const totalUsedMb = (
    downloadedItems.reduce((acc, curr) => acc + curr.fileSizeBytes, 0) /
    (1024 * 1024)
  ).toFixed(1);

  const handleDelete = (id: string) => {
    setDownloadedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setDownloadedItems([]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.screenTitle}>Offline Library</Text>
        <Text style={styles.screenSubtitle}>
          Downloaded lessons are available anytime without internet connectivity.
        </Text>

        {/* Storage Gauge Card */}
        <Card variant="highlight" style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <View style={styles.storageLeft}>
              <HardDrive size={22} color={colors.secondary.light} />
              <View>
                <Text style={styles.storageTitle}>Local Offline Storage</Text>
                <Text style={styles.storageDetail}>{totalUsedMb} MB used</Text>
              </View>
            </View>

            {downloadedItems.length > 0 && (
              <Pressable hitSlop={8} onPress={handleClearAll}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </Pressable>
            )}
          </View>

          {/* Storage Bar */}
          <View style={styles.storageBarBg}>
            <View
              style={[
                styles.storageBarFill,
                { width: `${Math.min(Number(totalUsedMb) * 2, 100)}%` },
              ]}
            />
          </View>
        </Card>

        {/* List of Downloaded Lessons */}
        <FlatList
          data={downloadedItems}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <WifiOff size={48} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No Downloaded Lessons</Text>
              <Text style={styles.emptySubtitle}>
                Tap the download button on any lesson to save it for offline learning.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card
              onPress={() =>
                navigation.navigate('LessonDetail', {
                  lessonId: item.id,
                  lessonTitle: item.title,
                })
              }
              style={styles.itemCard}
            >
              <View style={styles.itemRow}>
                <View style={styles.iconBox}>
                  {item.mediaType === MEDIA_TYPES.VIDEO ? (
                    <PlayCircle size={22} color={colors.primary.light} />
                  ) : (
                    <Volume2 size={22} color={colors.secondary.light} />
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.subject} • {(item.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB •{' '}
                    {item.downloadedAt}
                  </Text>
                </View>

                <Pressable
                  hitSlop={8}
                  onPress={() => handleDelete(item.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} color={colors.error.light} />
                </Pressable>
              </View>
            </Card>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    padding: spacing.screenPadding,
  },
  screenTitle: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '800',
  },
  screenSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  storageCard: {
    backgroundColor: colors.surface.card,
    borderColor: colors.secondary.dark,
    marginBottom: spacing.lg,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  storageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  storageTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  storageDetail: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  clearAllText: {
    ...typography.caption,
    color: colors.error.light,
    fontWeight: '700',
  },
  storageBarBg: {
    height: 6,
    backgroundColor: colors.surface.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: colors.secondary.main,
    borderRadius: radii.full,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  itemCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: '#312E8130',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.text.muted,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.secondary,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.text.muted,
    textAlign: 'center',
    maxWidth: 260,
  },
});
