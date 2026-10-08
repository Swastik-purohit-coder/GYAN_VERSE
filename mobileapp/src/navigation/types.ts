/**
 * React Navigation Type Definitions for GyanVerse Mobile
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { Lesson, Course } from '../../../shared/types';

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type StudentTabParamList = {
  Home: undefined;
  Courses: undefined;
  Downloads: undefined;
  StudyBuddy: undefined;
  Profile: undefined;
};

export type StudentStackParamList = {
  StudentTabs: NavigatorScreenParams<StudentTabParamList>;
  LessonsList: { subjectId: string; subjectTitle: string };
  LessonDetail: { lessonId: string; lessonTitle: string };
  Quiz: { lessonId: string; quizTitle: string };
  QuizResults: { lessonId: string; score: number; total: number; xpEarned: number };
  Leaderboard: undefined;
  Achievements: undefined;
  Search: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  StudentRoot: NavigatorScreenParams<StudentStackParamList>;
};
