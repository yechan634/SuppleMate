import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface User {
  id: string;
  fullName: string;
  email: string;
  userType?: string;
  createdAt: string;
  lastLogin?: string;
  dateOfBirth?: string;
  weight?: number;
  height?: number;
  gender?: string;
  alcohol?: string;
  smoking?: string;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  // Refresh user data when screen comes into focus (e.g., returning from questionnaire)
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        // If no user data found, redirect to welcome
        router.replace('/welcome');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/welcome');
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        try {
          setIsLoading(true);
          await AsyncStorage.removeItem('user');
          router.replace('/welcome');
        } catch (error) {
          console.error('Error during logout:', error);
          window.alert('Error occurred during logout. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoading(true);
                await AsyncStorage.removeItem('user');
                router.replace('/welcome');
              } catch (error) {
                console.error('Error during logout:', error);
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]
      );
    }
  };  const handleEditProfile = () => {
    if (!user) return;

    // Only allow profile editing for supplement users
    if (user.userType === 'doctor') {
      if (Platform.OS === 'web') {
        window.alert('Doctors do not need to fill health information.');
      } else {
        Alert.alert('Not Available', 'Doctors do not need to fill health information.');
      }
      return;
    }

    // Navigate to questionnaire with pre-filled data
    router.push({
      pathname: '/questionnaire',
      params: {
        update: 'true',
        dateOfBirth: user.dateOfBirth || '',
        weight: user.weight?.toString() || '',
        height: user.height?.toString() || '',
        gender: user.gender || '',
        alcohol: user.alcohol || '',
        smoking: user.smoking || '',
      },
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 + 60 + 32 }} // 40 for logoutButton marginTop, 60 for nav bar, 32 for extra spacing
    >
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.appName, { color: colors.primary }]}>
          {Config.APP_NAME}
        </ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText type="subtitle" style={[styles.title, { color: colors.text }]}>
          User Profile
        </ThemedText>

        {user ? (
          <View style={styles.userInfo}>
            <View style={styles.infoItem}>
              <ThemedText style={[styles.label, { color: colors.icon }]}>
                Full Name
              </ThemedText>
              <ThemedText style={[styles.value, { color: colors.text }]}>
                {user.fullName}
              </ThemedText>
            </View>

            <View style={styles.infoItem}>
              <ThemedText style={[styles.label, { color: colors.icon }]}>
                Email
              </ThemedText>
              <ThemedText style={[styles.value, { color: colors.text }]}>
                {user.email}
              </ThemedText>
            </View>

            <View style={styles.infoItem}>
              <ThemedText style={[styles.label, { color: colors.icon }]}>
                Account Type
              </ThemedText>
              <ThemedText style={[styles.value, { color: colors.text }]}>
                {user.userType === 'doctor' ? 'Doctor' : 'Supplement User'}
              </ThemedText>
            </View>

            <View style={styles.infoItem}>
              <ThemedText style={[styles.label, { color: colors.icon }]}>
                User ID
              </ThemedText>
              <ThemedText style={[styles.value, { color: colors.text }]} selectable>
                {user.id}
              </ThemedText>
              <ThemedText style={[styles.helpText, { color: colors.icon }]}>
                Share this ID with {user.userType === 'doctor' ? 'patients' : 'doctors'} to connect
              </ThemedText>
            </View>

            <View style={styles.infoItem}>
              <ThemedText style={[styles.label, { color: colors.icon }]}>
                Member Since
              </ThemedText>
              <ThemedText style={[styles.value, { color: colors.text }]}>
                {new Date(user.createdAt).toLocaleDateString()}
              </ThemedText>
            </View>

            {user.lastLogin && (
              <View style={styles.infoItem}>
                <ThemedText style={[styles.label, { color: colors.icon }]}>
                  Last Login
                </ThemedText>
                <ThemedText style={[styles.value, { color: colors.text }]}>
                  {new Date(user.lastLogin).toLocaleString()}
                </ThemedText>
              </View>
            )}

            {/* Health Information Section - Only for Supplement Users */}
            {user.userType !== 'doctor' && (
              <View style={styles.healthSection}>
                <View style={styles.sectionHeader}>
                  <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                    Health Information
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: colors.primary }]}
                    onPress={handleEditProfile}
                    disabled={isLoading}
                  >
                    <ThemedText style={styles.editButtonText}>
                      Edit Profile
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoItem}>
                  <ThemedText style={[styles.label, { color: colors.icon }]}>
                    Date of Birth
                  </ThemedText>
                  <ThemedText style={[styles.value, { color: colors.text }]}>
                    {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not set'}
                  </ThemedText>
                </View>

                <View style={styles.infoItem}>
                  <ThemedText style={[styles.label, { color: colors.icon }]}>
                    Weight
                  </ThemedText>
                  <ThemedText style={[styles.value, { color: colors.text }]}>
                    {user.weight ? `${user.weight} kg` : 'Not set'}
                  </ThemedText>
                </View>

                <View style={styles.infoItem}>
                  <ThemedText style={[styles.label, { color: colors.icon }]}>
                    Height
                  </ThemedText>
                  <ThemedText style={[styles.value, { color: colors.text }]}>
                    {user.height ? `${user.height} cm` : 'Not set'}
                  </ThemedText>
                </View>

                <View style={styles.infoItem}>
                  <ThemedText style={[styles.label, { color: colors.icon }]}>
                    Gender
                  </ThemedText>
                  <ThemedText style={[styles.value, { color: colors.text }]}>
                    {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1).replace('-', ' ') : 'Not set'}
                  </ThemedText>
                </View>

                <View style={styles.infoItem}>
                  <ThemedText style={[styles.label, { color: colors.icon }]}>
                    Alcohol Usage
                  </ThemedText>
                  <ThemedText style={[styles.value, { color: colors.text }]}>
                    {user.alcohol ? user.alcohol.charAt(0).toUpperCase() + user.alcohol.slice(1) : 'Not set'}
                  </ThemedText>
                </View>

                <View style={styles.infoItem}>
                  <ThemedText style={[styles.label, { color: colors.icon }]}>
                    Smoking Usage
                  </ThemedText>
                  <ThemedText style={[styles.value, { color: colors.text }]}>
                    {user.smoking ? user.smoking.charAt(0).toUpperCase() + user.smoking.slice(1) : 'Not set'}
                  </ThemedText>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: '#ff4444' }]}
              onPress={handleLogout}
              disabled={isLoading}
            >
              <ThemedText style={styles.logoutButtonText}>
                {isLoading ? 'Logging out...' : 'Logout'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <ThemedText style={[styles.placeholderText, { color: colors.icon }]}>
              Loading user information...
            </ThemedText>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 150, // Add bottom padding to account for tab bar
    paddingHorizontal: 16, // reduce from 20 for safer edge
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16, // reduce from 20 for safer edge
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 40,
  },
  userInfo: {
    width: '100%',
    maxWidth: 400,
  },
  infoItem: {
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(125, 211, 198, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 198, 0.3)',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '400',
  },
  logoutButton: {
    marginTop: 40,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  healthSection: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    opacity: 0.7,
  },
});
