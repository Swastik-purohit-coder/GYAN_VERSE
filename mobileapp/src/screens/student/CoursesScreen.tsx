import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  Pressable,
} from 'react-native';
import { Search, Filter, BookOpen } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { CourseCard } from '../../components/student';
import { Badge } from '../../components/common';

export const CoursesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Mathematics', 'Computer Science', 'Science', 'General'];

  const courses = [
    {
      id: 'course-1',
      title: 'Algebra & Quadratic Equations',
      description: 'Comprehensive algebraic foundations, polynomial operations, and formula mastery.',
      category: 'Mathematics',
      totalLessons: 10,
      completedLessons: 6,
    },
    {
      id: 'course-2',
      title: 'Data Structures & Algorithms in Python',
      description: 'Arrays, linked lists, trees, graphs, and Big-O efficiency analysis.',
      category: 'Computer Science',
      totalLessons: 14,
      completedLessons: 3,
    },
    {
      id: 'course-3',
      title: 'Newtonian Physics & Mechanics',
      description: 'Laws of motion, work, energy, momentum, and rotational dynamics.',
      category: 'Science',
      totalLessons: 8,
      completedLessons: 8,
    },
    {
      id: 'course-4',
      title: 'Organic Chemistry Reactions',
      description: 'Hydrocarbons, functional groups, reaction mechanisms, and isomerism.',
      category: 'Science',
      totalLessons: 12,
      completedLessons: 0,
    },
  ];

  const filteredCourses = courses.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.screenTitle}>Course Library</Text>
        <Text style={styles.screenSubtitle}>
          Select a subject module to begin or continue your lesson path.
        </Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.text.muted} />
          <TextInput
            placeholder="Search courses and topics..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.categoryScroll}>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryPill,
                selectedCategory === cat && styles.categoryPillActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === cat && styles.categoryPillTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Course List */}
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <CourseCard
              id={item.id}
              title={item.title}
              description={item.description}
              category={item.category}
              totalLessons={item.totalLessons}
              completedLessons={item.completedLessons}
              onPress={() =>
                navigation.navigate('LessonsList', {
                  subjectId: item.id,
                  subjectTitle: item.title,
                })
              }
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.input,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: spacing.md,
    height: 46,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    ...typography.bodyMedium,
  },
  categoryScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  categoryPill: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  categoryPillActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.light,
  },
  categoryPillText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
});
