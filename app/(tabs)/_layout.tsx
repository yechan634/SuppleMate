import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface User {
  id: string;
  fullName: string;
  email: string;
  userType?: string;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserType();
  }, []);

  // Refresh user type when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserType();
    }, [])
  );

  const loadUserType = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user: User = JSON.parse(userData);
        console.log('User data loaded:', user);
        console.log('User type detected:', user.userType);
        setUserType(user.userType || 'supplement_user');
      }
    } catch (error) {
      console.error('Error loading user type:', error);
      setUserType('supplement_user'); // Default to supplement_user
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while determining user type
  if (isLoading) {
    return null;
  }

  const isDoctor = userType === 'doctor';

  // Common tab bar options
  const commonScreenOptions = {
    tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarBackground: TabBarBackground,
    tabBarStyle: Platform.select({
      ios: {
        // Use a transparent background on iOS to show the blur effect
        position: 'absolute' as const,
      },
      default: {},
    }),
  };

  if (isDoctor) {
    // Doctor Navigation - My Patients and Profile
    return (
      <Tabs screenOptions={commonScreenOptions} initialRouteName="patients">
        <Tabs.Screen
          name="patients"
          options={{
            title: 'My Patients',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="stethoscope" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
          }}
        />
        {/* Hide supplement user tabs for doctors */}
        <Tabs.Screen
          name="research"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="manage"
          options={{
            href: null,
          }}
        />
      </Tabs>
    );
  } else {
    // Supplement User Navigation - Research, My Doctors, Tracker, Manage, Profile
    return (
      <Tabs screenOptions={commonScreenOptions}>
        <Tabs.Screen
          name="research"
          options={{
            title: 'Research',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="book.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: 'My Doctors',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="heart.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Tracker',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="checkmark.circle" color={color} />,
          }}
        />
        <Tabs.Screen
          name="manage"
          options={{
            title: 'Manage',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="pill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
          }}
        />
        {/* Hide doctor-specific tabs for supplement users */}
        <Tabs.Screen
          name="patients"
          options={{
            href: null,
          }}
        />
      </Tabs>
    );
  }
}
