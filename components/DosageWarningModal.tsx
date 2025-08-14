import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DosageRange } from '@/utils/DosageCalculator';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconSymbol } from './ui/IconSymbol';

interface DosageWarningModalProps {
  visible: boolean;
  onClose: () => void;
  onAddAnyway: () => void;
  supplementName: string;
  enteredDosage: string;
  recommendedRange: DosageRange;
  isAboveRange: boolean;
  isBelowRange: boolean;
}

export default function DosageWarningModal({
  visible,
  onClose,
  onAddAnyway,
  supplementName,
  enteredDosage,
  recommendedRange,
  isAboveRange,
  isBelowRange
}: DosageWarningModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getWarningType = () => {
    if (isAboveRange) return 'ABOVE';
    if (isBelowRange) return 'BELOW';
    return 'OUT OF';
  };

  const getWarningColor = () => {
    if (isAboveRange) return '#FF3B30'; // Red for too high
    if (isBelowRange) return '#FF9500'; // Orange for too low
    return '#FF9500';
  };

  const getWarningIcon = () => {
    if (isAboveRange) return 'exclamationmark.triangle.fill';
    if (isBelowRange) return 'exclamationmark.circle.fill';
    return 'exclamationmark.triangle.fill';
  };

  const warningColor = getWarningColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Warning Icon */}
          <View style={[styles.iconContainer, { backgroundColor: warningColor + '20' }]}>
            <IconSymbol
              name={getWarningIcon() as any}
              size={48}
              color={warningColor}
            />
          </View>

          {/* Warning Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Dosage {getWarningType()} Range
          </Text>

          {/* Warning Message */}
          <Text style={[styles.message, { color: colors.text }]}>
            The dosage you entered for <Text style={{ fontWeight: 'bold' }}>{supplementName}</Text> is{' '}
            {isAboveRange ? 'higher' : 'lower'} than the recommended range for your profile.
          </Text>

          {/* Dosage Comparison */}
          <View style={[styles.dosageComparison, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.dosageRow}>
              <Text style={[styles.dosageLabel, { color: colors.icon }]}>Your dosage:</Text>
              <Text style={[styles.dosageValue, { color: warningColor }]}>{enteredDosage}</Text>
            </View>
            <View style={styles.dosageRow}>
              <Text style={[styles.dosageLabel, { color: colors.icon }]}>Recommended range:</Text>
              <Text style={[styles.dosageValue, { color: colors.primary }]}>
                {recommendedRange.min}-{recommendedRange.max} {recommendedRange.unit}
              </Text>
            </View>
            <Text style={[styles.dosageDescription, { color: colors.icon }]}>
              {recommendedRange.description}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.icon }]}
              onPress={onClose}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Change Dosage
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: warningColor }]}
              onPress={onAddAnyway}
            >
              <Text style={styles.primaryButtonText}>
                Add Anyway
              </Text>
            </TouchableOpacity>
          </View>

          {/* Small disclaimer */}
          <Text style={[styles.smallDisclaimer, { color: colors.icon }]}>
            Always consult your healthcare provider about dosages
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  dosageComparison: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  dosageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dosageLabel: {
    fontSize: 14,
    flex: 1,
  },
  dosageValue: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  dosageDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 12,
    textAlign: 'center'
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center'
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    textAlign: 'center'
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  smallDisclaimer: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
