import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StudentTabNavigator } from './StudentTabNavigator';
import { LessonsListScreen } from '../screens/student/LessonsListScreen';
import { LessonDetailScreen } from '../screens/student/LessonDetailScreen';
import { QuizScreen } from '../screens/student/QuizScreen';
import { StudentStackParamList } from './types';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<StudentStackParamList>();

export const StudentStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="StudentTabs" component={StudentTabNavigator} />
      <Stack.Screen name="LessonsList" component={LessonsListScreen} />
      <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
    </Stack.Navigator>
  );
};
