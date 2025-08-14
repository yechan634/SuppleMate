import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DosageRange, PersonalInfo, SupplementDosageInfo, getWeightCategory } from '@/utils/DosageCalculator';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

interface DosageRecommendationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDosage: (dosage: string) => void;
  supplementName: string;
  dosageInfo: SupplementDosageInfo;
  personalInfo: PersonalInfo;
  currentDosage?: string;
}

export default function DosageRecommendationModal({
  visible,
  onClose,
  onSelectDosage,
  supplementName,
  dosageInfo,
  personalInfo,
  currentDosage
}: DosageRecommendationModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const weightCategory = getWeightCategory(personalInfo.gender, personalInfo.weight);
  const genderData = personalInfo.gender === 'male' ? dosageInfo.male : dosageInfo.female;
  const recommendedRange = genderData[weightCategory];

  // Calculate recommended dosage (midpoint)
  const recommendedDosage = Math.round((recommendedRange.min + recommendedRange.max) / 2);
  const recommendedDosageText = `${recommendedDosage} ${recommendedRange.unit}`;

  const renderDosageOption = (category: string, range: DosageRange, isRecommended: boolean = false) => {
    const midpoint = Math.round((range.min + range.max) / 2);
    const dosageText = `${midpoint} ${range.unit}`;
    
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.dosageOption,
          {
            backgroundColor: isRecommended ? colors.primary + '15' : colors.cardBackground,
            borderColor: isRecommended ? colors.primary : colors.border
          }
        ]}
        onPress={() => onSelectDosage(dosageText)}
      >
        <View style={styles.dosageHeader}>
          <Text style={[styles.dosageCategory, { color: colors.text }]}>
            {category.charAt(0).toUpperCase() + category.slice(1)} Weight
          </Text>
          {isRecommended && (
            <View style={[styles.recommendedBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.recommendedBadgeText}>Recommended</Text>
            </View>
          )}
        </View>
        <Text style={[styles.dosageRange, { color: colors.icon }]}>
          {range.min}-{range.max} {range.unit}
        </Text>
        <Text style={[styles.dosageValue, { color: colors.primary }]}>
          {dosageText}
        </Text>
        <Text style={[styles.dosageDescription, { color: colors.icon }]}>
          {range.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="xmark" size={24} color={colors.icon} />
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={[styles.title, { color: colors.text }]}>
              Dosage Recommendation
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Supplement Info */}
            <View style={[styles.supplementInfo, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.supplementHeader}>
                <IconSymbol name="pills" size={20} color={colors.primary} />
                <ThemedText type="defaultSemiBold" style={[styles.supplementName, { color: colors.text }]}>
                  {supplementName}
                </ThemedText>
              </View>
              <Text style={[styles.personalInfo, { color: colors.icon }]}>
                Based on your profile: {personalInfo.gender}, {personalInfo.weight}kg
              </Text>
            </View>

            {/* Quick Recommended Option */}
            <View style={[styles.quickRecommendation, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
              <View style={styles.quickRecommendationHeader}>
                <IconSymbol name="star.fill" size={16} color={colors.primary} />
                <Text style={[styles.quickRecommendationTitle, { color: colors.primary }]}>
                  Quick Recommendation
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.quickDosageButton, { backgroundColor: colors.primary }]}
                onPress={() => onSelectDosage(recommendedDosageText)}
              >
                <Text style={styles.quickDosageText}>{recommendedDosageText}</Text>
              </TouchableOpacity>
            </View>

            {/* All Options */}
            <View style={styles.allOptionsSection}>
              <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: colors.text }]}>
                All Options for {personalInfo.gender === 'male' ? 'Males' : 'Females'}
              </ThemedText>
              
              {Object.entries(genderData).map(([category, range]) => 
                renderDosageOption(category, range, category === weightCategory)
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    maxWidth: 400,
    width: '100%',
    borderRadius: 16,
    padding: 16, // reduce from 24 for safer edge
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  supplementInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  supplementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  supplementName: {
    fontSize: 16,
  },
  personalInfo: {
    fontSize: 14,
    marginLeft: 28,
  },
  quickRecommendation: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  quickRecommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  quickRecommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickDosageButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickDosageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  allOptionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  dosageOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  dosageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dosageCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  dosageRange: {
    fontSize: 12,
    marginBottom: 4,
  },
  dosageValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dosageDescription: {
    fontSize: 12,
  },
});
