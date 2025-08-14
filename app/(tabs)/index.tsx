import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { useColorScheme } from '@/hooks/useColorScheme';

// Updated to match database schema
type Supplement = {
  id: number;
  user_uid: string;
  name: string;
  dosage: string;
  frequency: string | { days?: number; hours?: number }; // Handle both formats
  first_take: string;
  supply_amount: number;
  type: string;
  created_at: string;
  updated_at: string;
};

type SupplementWithStatus = Supplement & {
  nextIntake: Date;
  timeUntilNext: string;
  isTaken: boolean;
};

const { width: screenWidth } = Dimensions.get('window');
const CLOCK_SIZE = Math.min(screenWidth * 0.6, 250);

export default function TrackerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [currentTime, setCurrentTime] = useState(new Date());
  const [supplements, setSupplements] = useState<SupplementWithStatus[]>([]);
  const [medications, setMedications] = useState<SupplementWithStatus[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastMidnightReset, setLastMidnightReset] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check if it's a new day and reset taken status
      const today = now.toDateString();
      if (lastMidnightReset !== today && now.getHours() === 0 && now.getMinutes() === 0) {
        resetDailyStatus();
        setLastMidnightReset(today);
      }
    }, 1000);

    loadUserAndFetchSupplements();
    setLastMidnightReset(new Date().toDateString());

    return () => clearInterval(timer);
  }, [lastMidnightReset]);

  const loadUserAndFetchSupplements = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        await fetchSupplements(user.id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        fetchSupplements();
      }
    }, [userId])
  );

  const resetDailyStatus = () => {
    console.log('Resetting daily status at midnight');
    setSupplements(prev => prev.map(item => ({ ...item, isTaken: false })));
    setMedications(prev => prev.map(item => ({ ...item, isTaken: false })));
  };

  const fetchSupplements = async (userIdParam?: string) => {
    try {
      const currentUserId = userIdParam || userId;
      if (!currentUserId) {
        console.log('No user ID available, skipping fetch');
        return;
      }

      const response = await fetch(
        `${Config.API_URL}/supplements?user_uid=${currentUserId}`
      );

      if (!response.ok) throw new Error('Failed to fetch supplements');

      const data: Supplement[] = await response.json();
      console.log('Fetched supplements from API:', data.length, 'items');

      // Process data and separate supplements from medications
      const processed = data.map(processSupplementData);
      const supplementsList = processed.filter(item => item.type === 'supplement');
      const medicationsList = processed.filter(item => item.type === 'medication');

      console.log('Processed:', supplementsList.length, 'supplements,', medicationsList.length, 'medications');

      setSupplements(supplementsList);
      setMedications(medicationsList);
    } catch (error) {
      console.error('Error fetching supplements:', error);
      // If there's an error, just set empty arrays
      setSupplements([]);
      setMedications([]);
    }
  };

  const processSupplementData = (supplement: Supplement): SupplementWithStatus => {
    const firstTake = new Date(supplement.first_take);
    const now = new Date();

    // Handle both database format (object) and mock data format (string)
    let nextIntake = new Date(firstTake);
    let timeUntilNext = 'Unknown';

    try {
      let hours = 24; // default
      let days = 0;

      // Check if frequency is an object (database format) or string (mock format)
      if (typeof supplement.frequency === 'object') {
        if ((supplement.frequency as any).hours) {
          hours = (supplement.frequency as any).hours;
        } else if ((supplement.frequency as any).days) {
          days = (supplement.frequency as any).days;
          hours = days * 24;
        } else if ((supplement.frequency as any).seconds) {
          // Database backend bug: it stores hours/days as seconds
          // Try to intelligently determine what the original value was
          const secondsValue = (supplement.frequency as any).seconds;
          if (secondsValue <= 168) { // Reasonable range for hours (1 week = 168 hours)
            hours = secondsValue;
          } else {
            // Treat as actual seconds, convert to hours
            hours = secondsValue / 3600;
          }
        }
      } else if (typeof supplement.frequency === 'string') {
        // Handle string format for mock data
        if (supplement.frequency.includes('hour')) {
          hours = parseInt(supplement.frequency.match(/\d+/)?.[0] || '24');
        } else if (supplement.frequency.includes('day')) {
          days = parseInt(supplement.frequency.match(/\d+/)?.[0] || '1');
          hours = days * 24;
        }
      }

      // Calculate next intake
      while (nextIntake <= now) {
        nextIntake = new Date(nextIntake.getTime() + hours * 60 * 60 * 1000);
      }

      const diffMs = nextIntake.getTime() - now.getTime();

      if (days > 0) {
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        timeUntilNext = diffDays > 0 ? `${diffDays}d ${diffHours}h` : `${diffHours}h`;
      } else {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        timeUntilNext = diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m`;
      }
    } catch (e) {
      console.error('Error parsing frequency:', e);
    }

    return {
      ...supplement,
      nextIntake,
      timeUntilNext,
      isTaken: false // Local state only - resets daily at midnight
    };
  };

  const toggleTaken = (id: number, type: 'supplement' | 'medication') => {
    // Find the item name for the success message
    const allItems = [...supplements, ...medications];
    const item = allItems.find(i => i.id === id);
    const itemName = item?.name || 'Item';

    // Update the local state
    if (type === 'supplement') {
      setSupplements(prev => prev.map(item =>
        item.id === id ? { ...item, isTaken: !item.isTaken } : item
      ));
    } else {
      setMedications(prev => prev.map(item =>
        item.id === id ? { ...item, isTaken: !item.isTaken } : item
      ));
    }
  };

  const getNextMedication = () => {
    const allItems = [...supplements, ...medications];
    const upcomingItems = allItems
      .filter(item => !item.isTaken)
      .sort((a, b) => a.nextIntake.getTime() - b.nextIntake.getTime());

    return upcomingItems[0] || null;
  };

  const ClockComponent = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    // Calculate progress through the day (0 to 1)
    const dayProgress = (hours * 60 + minutes) / (24 * 60);

    const centerX = CLOCK_SIZE / 2;
    const centerY = CLOCK_SIZE / 2;
    const radius = CLOCK_SIZE / 2 - 30;
    const strokeWidth = 20;

    // Calculate circumference for progress calculation
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference * (1 - dayProgress);

    // Get all items for positioning around clock
    const allItems = [...supplements, ...medications];

    return (
      <View style={styles.clockContainer}>
        <Svg width={CLOCK_SIZE} height={CLOCK_SIZE}>
          <Defs>
            <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#7dd3c6" stopOpacity="1" />
              <Stop offset="50%" stopColor="#4a90e2" stopOpacity="1" />
              <Stop offset="100%" stopColor="#2c3e50" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Background circle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke={colors.cardBackground}
            strokeWidth={strokeWidth}
          />

          {/* Progress circle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            transform={`rotate(-90 ${centerX} ${centerY})`}
          />

          {/* Current time in center */}
          <SvgText
            x={centerX}
            y={centerY - 10}
            fontSize="22"
            fill={colors.text}
            textAnchor="middle"
            fontWeight="bold"
          >
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </SvgText>

          <SvgText
            x={centerX}
            y={centerY + 15}
            fontSize="14"
            fill={colors.icon}
            textAnchor="middle"
          >
            {(() => {
              const nextSupplement = getNextMedication();
              if (nextSupplement) {
                return `Next: ${nextSupplement.name}`;
              }
              return 'All done for today!';
            })()}
          </SvgText>
        </Svg>

        {/* Supplement names positioned around the clock based on scheduled intake times */}
        {(() => {
          // Filter out taken supplements from clock display
          const visibleItems = allItems.filter(item => !item.isTaken);

          // Group items by similar times to prevent overlap
          const groupedItems = visibleItems.reduce((groups, item) => {
            const nextIntakeHours = item.nextIntake.getHours();
            const nextIntakeMinutes = item.nextIntake.getMinutes();
            const timeOfDay = nextIntakeHours + nextIntakeMinutes / 60;

            // Round to nearest 0.5 hour to group items within 30 minutes
            const roundedTime = Math.round(timeOfDay * 2) / 2;

            if (!groups[roundedTime]) {
              groups[roundedTime] = [];
            }
            groups[roundedTime].push(item);
            return groups;
          }, {} as Record<number, SupplementWithStatus[]>);

          // Render grouped items with offset positioning
          return Object.entries(groupedItems).map(([timeKey, items]) => {
            const timeOfDay = parseFloat(timeKey);
            const angle = (timeOfDay * 15) - 90;

            return items.map((item, groupIndex) => {
              // Calculate offset for overlapping items
              const offsetAngle = angle + (groupIndex - (items.length - 1) / 2) * 8; // 8 degree spread
              const distance = radius + 45 + (groupIndex * 5); // Slightly vary distance too

              const x = centerX + distance * Math.cos(offsetAngle * Math.PI / 180);
              const y = centerY + distance * Math.sin(offsetAngle * Math.PI / 180);

              // Adjust for container centering
              const containerHeight = CLOCK_SIZE + 80;
              const svgTopOffset = (containerHeight - CLOCK_SIZE) / 2;
              const adjustedY = y + svgTopOffset - 34; // Move labels up by 34 pixels

              // Calculate time until next dose in hours
              const timeDiff = item.nextIntake.getTime() - currentTime.getTime();
              const hoursUntil = timeDiff / (1000 * 60 * 60);

              // Bold if within 2 hours of next dose
              const isUpcoming = hoursUntil <= 2 && hoursUntil >= 0;

              return (
                <View
                  key={`${item.id}-${groupIndex}`}
                  style={[
                    styles.supplementLabel,
                    {
                      position: 'absolute',
                      left: x - 35,
                      top: adjustedY - 16,
                      backgroundColor: isUpcoming ? colors.primary : colors.cardBackground,
                      borderColor: isUpcoming ? colors.primary : colors.cardBackground,
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.supplementLabelText,
                      {
                        color: isUpcoming ? 'white' : colors.text,
                        fontWeight: isUpcoming ? 'bold' : 'normal',
                      }
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.name.split(' ')[0]}
                  </Text>
                  <Text
                    style={[
                      styles.supplementTimeText,
                      {
                        color: isUpcoming ? 'white' : colors.icon,
                        fontSize: 8,
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {item.nextIntake.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            });
          }).flat();
        })()}
      </View>
    );
  };

  const renderSupplementItem = (item: SupplementWithStatus, type: 'supplement' | 'medication') => (
    <TouchableOpacity
      key={item.id}
      style={[styles.supplementItem, { backgroundColor: colors.cardBackground }]}
      onPress={() => toggleTaken(item.id, type)}
    >
      <View style={styles.checkboxContainer}>
        <IconSymbol
          name={item.isTaken ? "checkmark.circle" : "plus.circle"}
          size={24}
          color={item.isTaken ? colors.success : colors.primary}
        />
      </View>
      <View style={styles.supplementInfo}>
        <Text style={[styles.supplementName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.supplementDosage, { color: colors.icon }]}>{item.dosage}</Text>
        <Text style={[styles.supplementTime, { color: colors.icon }]}>Next: {item.timeUntilNext}</Text>
      </View>
    </TouchableOpacity>
  );

  const nextMed = getNextMedication();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.appName, { color: colors.primary }]}>
          {Config.APP_NAME}
        </ThemedText>
      </View>

      {/* Circular Clock Display */}
      <View style={styles.clockContainer}>
        <ClockComponent />

        {/* Debug info for time-based positioning */}
        <View style={{ position: 'absolute', top: -40, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.icon }}>
            Current: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} |
            Items: {[...supplements, ...medications].length}
          </Text>
        </View>
      </View>

      {/* Two-Section Checklist */}
      <View style={styles.checklistContainer}>
        {/* Daily Requirements Summary */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground, marginBottom: 10 }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="calendar" size={20} color={colors.primary} />
            <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
              Today's Requirements
            </ThemedText>
          </View>
          <View style={styles.dailyRequirements}>
            {(() => {
              const allItems = [...supplements, ...medications];
              const totalItems = allItems.length;
              const takenItems = allItems.filter(item => item.isTaken).length;
              const pendingItems = totalItems - takenItems;

              return (
                <View style={styles.requirementRow}>
                  <Text style={[styles.requirementText, { color: colors.text }]}>
                    📋 {totalItems} items scheduled today
                  </Text>
                  <Text style={[styles.requirementText, { color: colors.success }]}>
                    ✅ {takenItems} completed
                  </Text>
                  <Text style={[styles.requirementText, { color: pendingItems > 0 ? colors.danger : colors.success }]}>
                    ⏰ {pendingItems} remaining
                  </Text>
                </View>
              );
            })()}
          </View>
        </View>

        {/* My Supplements Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="pill" size={20} color={colors.primary} />
            <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
              My Supplements
            </ThemedText>
          </View>
          {supplements.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              No supplements added yet
            </Text>
          ) : (
            supplements.map(item => renderSupplementItem(item, 'supplement'))
          )}
        </View>

        {/* My Drugs Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="heart.fill" size={20} color={colors.danger} />
            <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
              My Medications
            </ThemedText>
          </View>
          {medications.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              No medications added yet
            </Text>
          ) : (
            medications.map(item => renderSupplementItem(item, 'medication'))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 90, // Add bottom padding to account for tab bar
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  clockContainer: {
    alignItems: 'center',
    marginVertical: 20,
    height: CLOCK_SIZE + 80, // Extra space for labels around the clock
    position: 'relative',
  },
  supplementLabel: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  supplementLabelText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  supplementTimeText: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 1,
  },
  checklistContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  supplementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  supplementInfo: {
    flex: 1,
  },
  supplementName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  supplementDosage: {
    fontSize: 14,
    marginBottom: 2,
  },
  supplementTime: {
    fontSize: 12,
  },
  dailyRequirements: {
    paddingTop: 8,
  },
  requirementRow: {
    gap: 4,
  },
  requirementText: {
    fontSize: 14,
    marginBottom: 2,
  },
});