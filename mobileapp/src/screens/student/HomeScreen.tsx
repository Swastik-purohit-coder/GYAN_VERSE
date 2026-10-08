import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import {
  Sparkles,
  BookOpen,
  Award,
  Search,
  ArrowRight,
  Calculator,
  Atom,
  Cpu,
  Globe,
} from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { StreakCard, CourseCard, LessonCard } from '../../components/student';
import { OfflineBanner, SyncStatusBadge, Card, Badge } from '../../components/common';
import { useAppStore } from '../../store/useAppStore';
import { apiClient } from '../../services/apiClient';
import { MEDIA_TYPES, DOWNLOAD_STATUS } from '../../../../shared/constants';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, isOffline, pendingSyncCount, isSyncing, syncStatus } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const subjects = [
    { id: 'math', title: 'Mathematics', icon: <Calculator size={20} color="#38BDF8" />, color: '#0284C7' },
    { id: 'science', title: 'Science', icon: <Atom size={20} color="#34D399" />, color: '#059669' },
    { id: 'cs', title: 'Computer Science', icon: <Cpu size={20} color="#818CF8" />, color: '#4F46E5' },
    { id: 'gk', title: 'General Studies', icon: <Globe size={20} color="#FBBF24" />, color: '#D97706' },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh check
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <OfflineBanner
        isOffline={isOffline}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.fullName || 'Gyan Explorer'}</Text>
          </View>
          <SyncStatusBadge status={syncStatus} />
        </View>

        {/* Daily Streak Card */}
        <StreakCard
          streakCount={user?.streakCount || 5}
          xpPoints={user?.xpPoints || 340}
          completedToday={true}
        />

        {/* Continue Learning Banner */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>
          <Pressable
            onPress={() => navigation.navigate('Courses')}
            style={styles.seeAllRow}
          >
            <Text style={styles.seeAllText}>All Subjects</Text>
            <ArrowRight size={14} color={colors.primary.light} />
          </Pressable>
        </View>

        <CourseCard
          id="course-math-1"
          title="Algebraic Expressions & Polynomials"
          description="Master linear equations, polynomial factoring, and quadratic graphs."
          category="Mathematics"
          totalLessons={8}
          completedLessons={5}
          onPress={() =>
            navigation.navigate('LessonsList', {
              subjectId: 'math',
              subjectTitle: 'Mathematics',
            })
          }
        />

        {/* Subject Explore Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Subjects</Text>
        </View>

        <View style={styles.subjectsGrid}>
          {subjects.map((sub) => (
            <Card
              key={sub.id}
              onPress={() =>
                navigation.navigate('LessonsList', {
                  subjectId: sub.id,
                  subjectTitle: sub.title,
                })
              }
              style={styles.subjectCard}
            >
              <View
                style={[
                  styles.subjectIconWrap,
                  { backgroundColor: `${sub.color}25`, borderColor: sub.color },
                ]}
              >
                {sub.icon}
              </View>
              <Text style={styles.subjectTitle}>{sub.title}</Text>
            </Card>
          ))}
        </View>

        {/* Recommended Lessons */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Up Next for You</Text>
        </View>

        <LessonCard
          id="lesson-cs-1"
          orderNumber={1}
          title="Time Complexity & Big-O Notation"
          durationMinutes={12}
          mediaType={MEDIA_TYPES.VIDEO}
          isCompleted={false}
          downloadStatus={DOWNLOAD_STATUS.DOWNLOADED}
          onPress={() =>
            navigation.navigate('LessonDetail', {
              lessonId: 'lesson-cs-1',
              lessonTitle: 'Time Complexity & Big-O Notation',
            })
          }
        />

        <LessonCard
          id="lesson-cs-2"
          orderNumber={2}
          title="Asymptotic Analysis & Master Theorem"
          durationMinutes={15}
          mediaType={MEDIA_TYPES.VIDEO}
          isCompleted={false}
          downloadStatus={DOWNLOAD_STATUS.NOT_DOWNLOADED}
          onPress={() =>
            navigation.navigate('LessonDetail', {
              lessonId: 'lesson-cs-2',
              lessonTitle: 'Asymptotic Analysis & Master Theorem',
            })
          }
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  greetingText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  userName: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    ...typography.caption,
    color: colors.primary.light,
    fontWeight: '600',
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  subjectCard: {
    width: '48%',
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  subjectIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  subjectTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
});
