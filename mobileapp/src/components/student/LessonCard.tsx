import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PlayCircle, Volume2, CheckCircle2, Download, Check, Clock } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { MEDIA_TYPES, MediaType, DOWNLOAD_STATUS, DownloadStatusType } from '../../../../shared/constants';

export interface LessonCardProps {
  id: string;
  orderNumber: number;
  title: string;
  durationMinutes: number;
  mediaType: MediaType;
  isCompleted?: boolean;
  downloadStatus?: DownloadStatusType;
  onPress: () => void;
  onDownloadPress?: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  orderNumber,
  title,
  durationMinutes,
  mediaType,
  isCompleted = false,
  downloadStatus = DOWNLOAD_STATUS.NOT_DOWNLOADED,
  onPress,
  onDownloadPress,
}) => {
  const isVideo = mediaType === MEDIA_TYPES.VIDEO;
  const isDownloaded = downloadStatus === DOWNLOAD_STATUS.DOWNLOADED;
  const isDownloading = downloadStatus === DOWNLOAD_STATUS.DOWNLOADING;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.contentRow}>
        {/* Leading Media Icon / Order */}
        <View style={[styles.iconContainer, isCompleted && styles.iconContainerCompleted]}>
          {isVideo ? (
            <PlayCircle size={22} color={isCompleted ? colors.success.main : colors.primary.light} />
          ) : (
            <Volume2 size={22} color={isCompleted ? colors.success.main : colors.secondary.light} />
          )}
        </View>

        {/* Text Details */}
        <View style={styles.textContainer}>
          <View style={styles.metaRow}>
            <Text style={styles.orderText}>Lesson {orderNumber}</Text>
            <View style={styles.durationRow}>
              <Clock size={11} color={colors.text.muted} />
              <Text style={styles.durationText}>{durationMinutes} min</Text>
            </View>
            {isDownloaded && (
              <Badge label="Offline" variant="success" size="sm" />
            )}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>

        {/* Action / Status trailing */}
        <View style={styles.actionsContainer}>
          {isCompleted ? (
            <CheckCircle2 size={22} color={colors.success.main} />
          ) : onDownloadPress ? (
            <Pressable
              hitSlop={8}
              onPress={onDownloadPress}
              style={[styles.downloadButton, isDownloaded && styles.downloadButtonDone]}
            >
              {isDownloaded ? (
                <Check size={16} color={colors.success.main} />
              ) : isDownloading ? (
                <Text style={styles.downloadingText}>...</Text>
              ) : (
                <Download size={16} color={colors.text.secondary} />
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: '#312E8140',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  iconContainerCompleted: {
    backgroundColor: '#064E3B40',
    borderColor: '#059669',
  },
  textContainer: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  orderText: {
    ...typography.caption,
    color: colors.primary.light,
    fontWeight: '700',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  title: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: spacing.xs,
  },
  downloadButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonDone: {
    backgroundColor: '#064E3B40',
    borderWidth: 1,
    borderColor: colors.success.main,
  },
  downloadingText: {
    ...typography.caption,
    color: colors.primary.light,
    fontWeight: '700',
  },
});
