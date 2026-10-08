import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { GraduationCap, Sparkles, WifiOff, ShieldCheck } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { Button, Card } from '../../components/common';
import { useAppStore } from '../../store/useAppStore';

export const WelcomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { setUser } = useAppStore();

  const handleGuestStudent = () => {
    // Continue as Demo Student
    navigation.navigate('StudentRoot', { screen: 'StudentTabs' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Brand Hero */}
        <View style={styles.brandHero}>
          <View style={styles.logoContainer}>
            <GraduationCap size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>GyanVerse</Text>
          <Text style={styles.brandSubtitle}>
            Offline-First Intelligent Learning Platform for Everyone
          </Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.highlightsContainer}>
          <Card variant="flat" style={styles.highlightCard}>
            <WifiOff size={20} color={colors.warning.light} />
            <View style={styles.highlightTextWrapper}>
              <Text style={styles.highlightTitle}>100% Offline Ready</Text>
              <Text style={styles.highlightDesc}>
                Download video & audio lectures with automatic offline synchronization.
              </Text>
            </View>
          </Card>

          <Card variant="flat" style={styles.highlightCard}>
            <Sparkles size={20} color={colors.primary.light} />
            <View style={styles.highlightTextWrapper}>
              <Text style={styles.highlightTitle}>AI Study Buddy</Text>
              <Text style={styles.highlightDesc}>
                Personalized intelligent tutor with interactive hints and quizzes.
              </Text>
            </View>
          </Card>

          <Card variant="flat" style={styles.highlightCard}>
            <ShieldCheck size={20} color={colors.success.light} />
            <View style={styles.highlightTextWrapper}>
              <Text style={styles.highlightTitle}>Low-RAM & Low-Data Optimized</Text>
              <Text style={styles.highlightDesc}>
                Chunk-based byte streaming designed to run smoothly on any phone.
              </Text>
            </View>
          </Card>
        </View>

        {/* CTA Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Explore as Student"
            variant="primary"
            size="lg"
            onPress={handleGuestStudent}
            style={styles.ctaButton}
          />
          <Button
            title="Sign In with Account"
            variant="outline"
            size="md"
            onPress={handleGuestStudent}
          />
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
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  brandHero: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: radii.xl,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary.light,
  },
  brandTitle: {
    ...typography.h1,
    color: colors.text.primary,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  brandSubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  highlightsContainer: {
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  highlightTextWrapper: {
    flex: 1,
  },
  highlightTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  highlightDesc: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  ctaButton: {
    backgroundColor: colors.primary.main,
  },
});
