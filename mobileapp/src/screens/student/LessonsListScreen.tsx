import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
} from 'react-native';
import { ArrowLeft, BookOpen, Download } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { LessonCard } from '../../components/student';
import { Button, Badge } from '../../components/common';
import { MEDIA_TYPES, DOWNLOAD_STATUS } from '../../../../shared/constants';

export const LessonsListScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { subjectId, subjectTitle } = route.params || {
    subjectId: 'cs',
    subjectTitle: 'Computer Science',
  };

  const [lessons, setLessons] = useState([
    {
      id: 'lesson-1',
      order: 1,
      title: 'Introduction to Algorithms & Complexity',
      durationMinutes: 12,
      mediaType: MEDIA_TYPES.VIDEO,
      isCompleted: true,
      downloadStatus: DOWNLOAD_STATUS.DOWNLOADED,
    },
    {
      id: 'lesson-2',
      order: 2,
      title: 'Big-O, Big-Omega, & Big-Theta Notations',
      durationMinutes: 15,
      mediaType: MEDIA_TYPES.VIDEO,
      isCompleted: true,
      downloadStatus: DOWNLOAD_STATUS.DOWNLOADED,
    },
    {
      id: 'lesson-3',
      order: 3,
      title: 'Array Operations & Memory Layout',
      durationMinutes: 10,
      mediaType: MEDIA_TYPES.VIDEO,
      isCompleted: false,
      downloadStatus: DOWNLOAD_STATUS.NOT_DOWNLOADED,
    },
    {
      id: 'lesson-4',
      order: 4,
      title: 'Singly vs Doubly Linked Lists',
      durationMinutes: 18,
      mediaType: MEDIA_TYPES.VIDEO,
      isCompleted: false,
      downloadStatus: DOWNLOAD_STATUS.NOT_DOWNLOADED,
    },
    {
      id: 'lesson-5',
      order: 5,
      title: 'Audio Summary: Recursion & Call Stacks',
      durationMinutes: 8,
      mediaType: MEDIA_TYPES.AUDIO,
      isCompleted: false,
      downloadStatus: DOWNLOAD_STATUS.NOT_DOWNLOADED,
    },
  ]);

  const handleDownload = (lessonId: string) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId ? { ...l, downloadStatus: DOWNLOAD_STATUS.DOWNLOADING } : l
      )
    );
    // Simulate download finish
    setTimeout(() => {
      setLessons((prev) =>
        prev.map((l) =>
          l.id === lessonId ? { ...l, downloadStatus: DOWNLOAD_STATUS.DOWNLOADED } : l
        )
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            hitSlop={8}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={colors.text.primary} />
          </Pressable>
          <View style={styles.titleWrapper}>
            <Text style={styles.navTitle} numberOfLines={1}>
              {subjectTitle}
            </Text>
            <Text style={styles.navSubtitle}>{lessons.length} Modules Available</Text>
          </View>
        </View>

        {/* Lessons List */}
        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <LessonCard
              id={item.id}
              orderNumber={item.order}
              title={item.title}
              durationMinutes={item.durationMinutes}
              mediaType={item.mediaType}
              isCompleted={item.isCompleted}
              downloadStatus={item.downloadStatus}
              onPress={() =>
                navigation.navigate('LessonDetail', {
                  lessonId: item.id,
                  lessonTitle: item.title,
                })
              }
              onDownloadPress={() => handleDownload(item.id)}
            />
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  titleWrapper: {
    flex: 1,
  },
  navTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  navSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
});
