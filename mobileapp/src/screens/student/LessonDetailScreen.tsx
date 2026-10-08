import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  CheckCircle2,
  HelpCircle,
  Clock,
  HardDrive,
  FileText,
} from 'lucide-react-native';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { Button, Card, Badge } from '../../components/common';
import { useAppStore } from '../../store/useAppStore';

export const LessonDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { lessonId, lessonTitle } = route.params || {
    lessonId: 'lesson-1',
    lessonTitle: 'Time Complexity & Big-O Notation',
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState(180); // 3 min
  const totalDurationSeconds = 720; // 12 min

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      setIsDownloaded(true);
    }, 1500);
  };

  const progressPercent = Math.round((progressSeconds / totalDurationSeconds) * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            hitSlop={8}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.navTitle} numberOfLines={1}>
            {lessonTitle}
          </Text>
        </View>

        {/* Video Player Simulation Card */}
        <View style={styles.playerContainer}>
          <View style={styles.playerPlaceholder}>
            <Pressable
              onPress={() => setIsPlaying(!isPlaying)}
              style={styles.playButtonCircle}
            >
              {isPlaying ? (
                <Pause size={28} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
              )}
            </Pressable>
            <Text style={styles.playerStatusText}>
              {isPlaying ? 'Streaming Chunk (206 Range)...' : 'Tap to Play Lesson Video'}
            </Text>
          </View>

          {/* Scrubber Bar */}
          <View style={styles.scrubberRow}>
            <View style={styles.scrubberTrack}>
              <View style={[styles.scrubberFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.scrubberTime}>03:00 / 12:00</Text>
          </View>
        </View>

        {/* Lesson Title & Metadata */}
        <View style={styles.metaSection}>
          <Text style={styles.title}>{lessonTitle}</Text>
          <View style={styles.badgesRow}>
            <Badge label="Computer Science" variant="primary" size="sm" />
            <Badge label="12 Minutes" variant="neutral" size="sm" />
            {isDownloaded && <Badge label="Offline Saved" variant="success" size="sm" />}
          </View>
        </View>

        {/* Offline Download Action */}
        <Card variant="flat" style={styles.downloadCard}>
          <View style={styles.downloadInfo}>
            <HardDrive size={20} color={colors.secondary.light} />
            <View>
              <Text style={styles.downloadTitle}>
                {isDownloaded ? 'Downloaded for Offline' : 'Save for Offline Study'}
              </Text>
              <Text style={styles.downloadDesc}>Estimated size: 8.4 MB (Low-RAM)</Text>
            </View>
          </View>

          <Button
            title={isDownloaded ? 'Saved' : isDownloading ? 'Downloading...' : 'Download'}
            variant={isDownloaded ? 'secondary' : 'primary'}
            size="sm"
            disabled={isDownloaded || isDownloading}
            onPress={handleDownload}
          />
        </Card>

        {/* Lesson Overview & Notes */}
        <View style={styles.notesSection}>
          <View style={styles.sectionHeader}>
            <FileText size={18} color={colors.primary.light} />
            <Text style={styles.sectionTitle}>Lesson Summary & Core Concepts</Text>
          </View>
          <Card style={styles.notesCard}>
            <Text style={styles.notesText}>
              1. **Big-O Notation ($O$)**: Represents the upper bound or worst-case runtime
              complexity of an algorithm.
            </Text>
            <Text style={styles.notesText}>
              2. **Common Complexities**:
              {'\n'}• $O(1)$ — Constant time (Array index lookup)
              {'\n'}• $O(\log n)$ — Logarithmic time (Binary Search)
              {'\n'}• $O(n)$ — Linear time (Single loop scan)
              {'\n'}• $O(n \log n)$ — Linearithmic time (Merge Sort)
              {'\n'}• $O(n^2)$ — Quadratic time (Nested loops)
            </Text>
          </Card>
        </View>

        {/* Assessment CTA */}
        <Button
          title="Take Practice Quiz (10 Questions)"
          variant="primary"
          size="lg"
          leftIcon={<HelpCircle size={20} color="#FFFFFF" style={{ marginRight: 8 }} />}
          onPress={() =>
            navigation.navigate('Quiz', {
              lessonId,
              quizTitle: `${lessonTitle} Quiz`,
            })
          }
          style={styles.quizButton}
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  navTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
    flex: 1,
  },
  playerContainer: {
    backgroundColor: '#020617',
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginBottom: spacing.lg,
  },
  playerPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  playButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  playerStatusText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  scrubberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#020617',
    gap: spacing.sm,
  },
  scrubberTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surface.border,
    borderRadius: radii.full,
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: colors.primary.light,
    borderRadius: radii.full,
  },
  scrubberTime: {
    ...typography.caption,
    color: colors.text.muted,
    fontSize: 10,
  },
  metaSection: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  downloadCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginBottom: spacing.lg,
  },
  downloadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  downloadTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  downloadDesc: {
    ...typography.caption,
    color: colors.text.muted,
  },
  notesSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  notesCard: {
    backgroundColor: colors.surface.card,
  },
  notesText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  quizButton: {
    marginTop: spacing.sm,
  },
});
