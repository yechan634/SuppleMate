import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { InteractionResult, InteractionSeverity } from '@/constants/DrugInteractions';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface InteractionModalProps {
  visible: boolean;
  drugName: string;
  interactionResult: InteractionResult;
  onAddAnyway: () => void;
  onDontAdd: () => void;
}

const InteractionModal: React.FC<InteractionModalProps> = ({
  visible,
  drugName,
  interactionResult,
  onAddAnyway,
  onDontAdd
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getIconAndColor = (severity: InteractionSeverity | null) => {
    if (severity === 'strong') {
      return { icon: 'xmark.circle.fill', color: '#FF3B30', bgColor: '#FFE5E5' };
    } else if (severity === 'mild') {
      return { icon: 'exclamationmark.triangle.fill', color: '#FF9500', bgColor: '#FFF4E5' };
    } else {
      return { icon: 'checkmark.circle.fill', color: '#34C759', bgColor: '#E5F9E5' };
    }
  };

  const { icon, color, bgColor } = getIconAndColor(interactionResult.severity);

  const getTitle = (severity: InteractionSeverity | null) => {
    if (severity === 'strong') {
      return 'Strong Drug Interaction Detected';
    } else if (severity === 'mild') {
      return 'Mild Drug Interaction Detected';
    } else {
      return 'No Interactions Detected';
    }
  };

  const getMessage = (severity: InteractionSeverity | null) => {
    if (severity === 'strong') {
      return 'A potentially serious interaction has been detected. Please consult your doctor before taking these medications together.';
    } else if (severity === 'mild') {
      return 'A mild interaction has been detected. Consider consulting your doctor or pharmacist about the timing and dosage.';
    } else {
      return `${drugName} has been successfully added to your list. No known interactions were detected with your current medications.`;
    }
  };

  if (!interactionResult.hasInteractions) {
    // Success modal for no interactions
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
              <IconSymbol name={icon as any} size={48} color={color} />
            </View>
            
            <Text style={[styles.title, { color: colors.text }]}>
              {getTitle(null)}
            </Text>
            
            <Text style={[styles.message, { color: colors.text }]}>
              {getMessage(null)}
            </Text>
            
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: color }]}
              onPress={onAddAnyway}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Interaction warning modal
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            <IconSymbol name={icon as any} size={48} color={color} />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            {getTitle(interactionResult.severity)}
          </Text>
          
          <Text style={[styles.message, { color: colors.text }]}>
            {getMessage(interactionResult.severity)}
          </Text>

          <ScrollView style={styles.interactionsList} showsVerticalScrollIndicator={false}>
            {interactionResult.interactions.map((interaction, index) => (
              <View key={index} style={[styles.interactionItem, { borderColor: colors.icon }]}>
                <View style={styles.interactionHeader}>
                  <IconSymbol 
                    name={interaction.severity === 'strong' ? 'exclamationmark.triangle.fill' : 'info.circle.fill'} 
                    size={16} 
                    color={interaction.severity === 'strong' ? '#FF3B30' : '#FF9500'} 
                  />
                  <Text style={[styles.conflictingDrug, { color: colors.text }]}>
                    {drugName} ↔ {interaction.conflictingDrug}
                  </Text>
                </View>
                <Text style={[styles.interactionDescription, { color: colors.icon }]}>
                  {interaction.description}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.icon }]}
              onPress={onDontAdd}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Don't Add
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: color }]}
              onPress={onAddAnyway}
            >
              <Text style={styles.primaryButtonText}>
                Consult Doctor
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.disclaimer, { color: colors.icon }]}>
            Always consult your healthcare provider about drug interactions
          </Text>
        </View>
      </View>
    </Modal>
  );
};

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
    marginBottom: 16,
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
    marginBottom: 20,
    lineHeight: 22,
  },
  interactionsList: {
    maxHeight: 200,
    width: '100%',
    marginBottom: 20,
  },
  interactionItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  interactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  conflictingDrug: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  interactionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default InteractionModal;
