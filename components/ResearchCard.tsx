import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StoredResearchEntry } from '@/services/newsService';
import { platformAlert } from '@/utils/platformAlert';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface ResearchCardProps {
  entry: StoredResearchEntry;
}

export default function ResearchCard({ entry }: ResearchCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePress = async () => {
    try {
      const canOpen = await Linking.canOpenURL(entry.url);
      if (canOpen) {
        await Linking.openURL(entry.url);
      } else {
        platformAlert('Error', 'Cannot open this link');
      }
    } catch (error) {
      platformAlert('Error', 'Failed to open the article');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: 'transparent',
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.textContent}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {entry.title}
          </Text>

          <Text
            style={[styles.summary, { color: colors.icon }]}
            numberOfLines={3}
          >
            {entry.summary}
          </Text>

          <View style={styles.metaInfo}>
            <Text style={[styles.source, { color: colors.primary }]}>
              {entry.source}
            </Text>
            <Text style={[styles.date, { color: colors.icon }]}>
              {formatDate(entry.published_date)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 0,
    padding: 18,
    marginVertical: 10,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 0,
  },
  cardContent: {
    flex: 1,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  summary: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  source: {
    fontSize: 12,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
  },
});
