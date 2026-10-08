import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BookOpen, HardDrive, Sparkles, User } from 'lucide-react-native';
import { colors, typography, spacing } from '../theme';
import { HomeScreen } from '../screens/student/HomeScreen';
import { CoursesScreen } from '../screens/student/CoursesScreen';
import { DownloadsScreen } from '../screens/student/DownloadsScreen';
import { StudyBuddyScreen } from '../screens/student/StudyBuddyScreen';
import { ProfileScreen } from '../screens/student/ProfileScreen';
import { StudentTabParamList } from './types';

const Tab = createBottomTabNavigator<StudentTabParamList>();

export const StudentTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.surface.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary.light,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          ...typography.caption,
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesScreen}
        options={{
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color, size }) => <BookOpen size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Downloads"
        component={DownloadsScreen}
        options={{
          tabBarLabel: 'Offline',
          tabBarIcon: ({ color, size }) => <HardDrive size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="StudyBuddy"
        component={StudyBuddyScreen}
        options={{
          tabBarLabel: 'AI Buddy',
          tabBarIcon: ({ color, size }) => <Sparkles size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
