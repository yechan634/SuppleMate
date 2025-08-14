import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { InteractionResult, InteractionSeverity } from '@/constants/DrugInteractions';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DrugInteractionModalProps {
    visible: boolean;
    onClose: () => void;
    result: InteractionResult;
    drug1: string;
    drug2: string;
}

const DrugInteractionModal: React.FC<DrugInteractionModalProps> = ({
    visible,
    onClose,
    result,
    drug1,
    drug2
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

    const { icon, color, bgColor } = getIconAndColor(result.severity);

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
            return `A potentially serious interaction has been detected between ${drug1} and ${drug2}. Please consult your doctor before taking these medications together.`;
        } else if (severity === 'mild') {
            return `A mild interaction has been detected between ${drug1} and ${drug2}. Consider consulting your doctor or pharmacist about the timing and dosage.`;
        } else {
            return `No known interactions were detected between ${drug1} and ${drug2}.`;
        }
    };

    if (!result.hasInteractions) {
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
                            onPress={onClose}
                        >
                            <Text style={styles.primaryButtonText}>Close</Text>
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
                        {getTitle(result.severity)}
                    </Text>

                    <Text style={[styles.message, { color: colors.text }]}>
                        {getMessage(result.severity)}
                    </Text>

                    <ScrollView style={styles.interactionsList} showsVerticalScrollIndicator={false}>
                        {result.interactions.map((interaction, index) => (
                            <View key={index} style={[styles.interactionItem, { borderColor: colors.border }]}>
                                <View style={styles.severityBadge}>
                                    <Text style={[styles.severityText, { color: interaction.severity === 'strong' ? '#FF3B30' : '#FF9500' }]}>
                                        {interaction.severity.toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={[styles.interactionDescription, { color: colors.text }]}>
                                    {interaction.description}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                        onPress={onClose}
                    >
                        <Text style={styles.primaryButtonText}>Close</Text>
                    </TouchableOpacity>
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
        borderRadius: 20,
        padding: 24,
        minWidth: 300,
        maxWidth: '90%',
        maxHeight: '80%',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
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
    interactionsList: {
        maxHeight: 200,
        marginBottom: 20,
    },
    interactionItem: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    severityBadge: {
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    severityText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    interactionDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    primaryButton: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default DrugInteractionModal;
