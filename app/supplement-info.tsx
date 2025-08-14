import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { useColorScheme } from '@/hooks/useColorScheme';
import { platformAlert } from '@/utils/platformAlert';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SupplementInfo {
  name: string;
  sideEffects: string[];
  commonDosage: string;
  warnings: string[];
  interactions: string[];
}

interface SupplementInfoResponse {
  found: boolean;
  supplement: SupplementInfo;
}

export default function SupplementInfoScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [supplementInfo, setSupplementInfo] = useState<SupplementInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);

  useEffect(() => {
    if (name) {
      fetchSupplementInfo();
    }
  }, [name]);

  const fetchSupplementInfo = async () => {
    if (!name) return;

    try {
      setLoading(true);
      const response = await fetch(`${Config.API_URL}/supplements/${encodeURIComponent(name)}/info`);

      if (!response.ok) {
        throw new Error('Failed to fetch supplement information');
      }

      const data: SupplementInfoResponse = await response.json();
      setSupplementInfo(data.supplement);
      setFound(data.found);
    } catch (error) {
      console.error('Error fetching supplement info:', error);
      platformAlert('Error', 'Failed to load supplement information');
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (title: string, items: string[], icon: string) => (
    <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.sectionHeader}>
        <IconSymbol name={icon as any} size={20} color={colors.primary} />
        <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </ThemedText>
      </View>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
          <Text style={[styles.listItemText, { color: colors.text }]}>{item}</Text>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
          </TouchableOpacity>
          <ThemedText type="title" style={[styles.headerTitle, { color: colors.text }]}>
            Supplement Info
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>Loading supplement information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!supplementInfo) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
          </TouchableOpacity>
          <ThemedText type="title" style={[styles.headerTitle, { color: colors.text }]}>
            Supplement Info
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            No information available for this supplement
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: colors.text }]}>
          {supplementInfo.name}
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Information Status */}
        {!found && (
          <View style={[styles.noticeContainer, { backgroundColor: colors.cardBackground, borderColor: colors.warning }]}>
            <IconSymbol name="info.circle" size={20} color={colors.warning} />
            <Text style={[styles.noticeText, { color: colors.text }]}>
              This supplement was not found in our database. General supplement information is shown below.
            </Text>
          </View>
        )}

        {/* Common Dosage */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="pills" size={20} color={colors.primary} />
            <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: colors.text }]}>
              Common Dosage
            </ThemedText>
          </View>
          <Text style={[styles.dosageText, { color: colors.text }]}>{supplementInfo.commonDosage}</Text>
        </View>

        {/* Side Effects */}
        {renderSection('Potential Side Effects', supplementInfo.sideEffects, 'exclamationmark.triangle')}

        {/* Warnings */}
        {renderSection('Important Warnings', supplementInfo.warnings, 'exclamationmark.shield')}

        {/* Drug Interactions */}
        {renderSection('Drug Interactions', supplementInfo.interactions, 'pill.2')}

        {/* Disclaimer */}
        <View style={[styles.disclaimerContainer, { backgroundColor: colors.cardBackground, borderColor: colors.icon }]}>
          <IconSymbol name="info.circle" size={16} color={colors.icon} />
          <Text style={[styles.disclaimerText, { color: colors.icon }]}>
            This information is for educational purposes only and should not replace professional medical advice.
            Always consult with your healthcare provider before starting, stopping, or changing any supplement regimen.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 2,
  },
  placeholder: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16, // reduce from 20 for safer edge
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dosageText: {
    fontSize: 16,
    fontWeight: '500',
    paddingLeft: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 4,
  },
  bulletPoint: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 1,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
