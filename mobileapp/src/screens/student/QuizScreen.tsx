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
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Award,
} from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { Button, Card, Badge } from '../../components/common';
import { useAppStore } from '../../store/useAppStore';

export const QuizScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { quizTitle = 'Big-O Analysis Practice Quiz' } = route.params || {};

  const questions = [
    {
      id: 'q1',
      question: 'What is the worst-case time complexity of Binary Search on a sorted array?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctIndex: 1,
      explanation:
        'Binary Search repeatedly divides the search space in half at each comparison, yielding O(log n) time complexity.',
    },
    {
      id: 'q2',
      question: 'Which of the following operations is O(1) in a standard array?',
      options: [
        'Accessing an element by index',
        'Inserting at the beginning',
        'Searching for an unsorted element',
        'Deleting an arbitrary element',
      ],
      correctIndex: 0,
      explanation:
        'Array elements are stored contiguously in memory, so calculating the address for index lookup takes constant O(1) time.',
    },
    {
      id: 'q3',
      question: 'What is the average time complexity of QuickSort?',
      options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
      correctIndex: 1,
      explanation:
        'QuickSort partitions elements recursively, achieving O(n log n) average time performance.',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(index);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;

    const isCorrect = selectedOption === currentQuestion.correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
    }
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    const xpEarned = score * 20;
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.resultsContainer}>
          <Award size={64} color="#F59E0B" />
          <Text style={styles.resultsTitle}>Quiz Completed!</Text>
          <Text style={styles.scoreText}>
            You scored {score} out of {questions.length}
          </Text>
          <Badge
            label={`+${xpEarned} XP Earned`}
            variant="warning"
            size="md"
            style={styles.xpBadge}
          />

          <Card variant="highlight" style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Offline Progress Saved</Text>
            <Text style={styles.summaryDesc}>
              Your score and streak progress have been recorded in local storage and will sync
              automatically with GyanVerse.
            </Text>
          </Card>

          <Button
            title="Return to Home"
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('Home')}
            style={styles.homeButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Nav Header */}
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
              {quizTitle}
            </Text>
            <Text style={styles.progressText}>
              Question {currentIndex + 1} of {questions.length}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>

        {/* Question Card */}
        <Card style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </Card>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((opt, idx) => {
            let cardStyle = styles.optionDefault;
            let isSelected = selectedOption === idx;

            if (isAnswerSubmitted) {
              if (idx === currentQuestion.correctIndex) {
                cardStyle = styles.optionCorrect;
              } else if (isSelected) {
                cardStyle = styles.optionWrong;
              }
            } else if (isSelected) {
              cardStyle = styles.optionSelected;
            }

            return (
              <Pressable
                key={idx}
                onPress={() => handleSelectOption(idx)}
                style={[styles.optionBase, cardStyle]}
              >
                <View style={styles.optionLetterBox}>
                  <Text style={styles.optionLetter}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={styles.optionText}>{opt}</Text>
                {isAnswerSubmitted && idx === currentQuestion.correctIndex && (
                  <CheckCircle2 size={20} color={colors.success.main} />
                )}
                {isAnswerSubmitted &&
                  isSelected &&
                  idx !== currentQuestion.correctIndex && (
                    <XCircle size={20} color={colors.error.main} />
                  )}
              </Pressable>
            );
          })}
        </View>

        {/* Explanation Card (shows after answer) */}
        {isAnswerSubmitted && (
          <Card variant="flat" style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <HelpCircle size={16} color={colors.primary.light} />
              <Text style={styles.explanationTitle}>Explanation</Text>
            </View>
            <Text style={styles.explanationText}>
              {currentQuestion.explanation}
            </Text>
          </Card>
        )}

        {/* Bottom CTA */}
        <View style={styles.actionContainer}>
          {!isAnswerSubmitted ? (
            <Button
              title="Submit Answer"
              variant="primary"
              size="lg"
              disabled={selectedOption === null}
              onPress={handleSubmitAnswer}
            />
          ) : (
            <Button
              title={
                currentIndex + 1 === questions.length
                  ? 'View Results'
                  : 'Next Question'
              }
              variant="primary"
              size="lg"
              onPress={handleNextQuestion}
            />
          )}
        </View>
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
    marginBottom: spacing.sm,
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
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text.primary,
  },
  progressText: {
    ...typography.caption,
    color: colors.primary.light,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.surface.border,
    borderRadius: radii.full,
    marginVertical: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: radii.full,
  },
  questionCard: {
    backgroundColor: colors.surface.card,
    marginVertical: spacing.md,
    padding: spacing.lg,
  },
  questionText: {
    ...typography.h3,
    color: colors.text.primary,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  optionDefault: {
    backgroundColor: colors.surface.card,
    borderColor: colors.surface.border,
  },
  optionSelected: {
    backgroundColor: '#312E8140',
    borderColor: colors.primary.main,
  },
  optionCorrect: {
    backgroundColor: '#064E3B40',
    borderColor: colors.success.main,
  },
  optionWrong: {
    backgroundColor: '#7F1D1D40',
    borderColor: colors.error.main,
  },
  optionLetterBox: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetter: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  optionText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  explanationCard: {
    backgroundColor: colors.surface.card,
    borderColor: colors.primary.subtle,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  explanationTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary.light,
    textTransform: 'uppercase',
  },
  explanationText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  actionContainer: {
    marginTop: spacing.md,
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  resultsTitle: {
    ...typography.h1,
    color: colors.text.primary,
  },
  scoreText: {
    ...typography.h3,
    color: colors.text.secondary,
  },
  xpBadge: {
    marginVertical: spacing.xs,
  },
  summaryCard: {
    marginVertical: spacing.lg,
    width: '100%',
  },
  summaryTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  summaryDesc: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  homeButton: {
    width: '100%',
  },
});
