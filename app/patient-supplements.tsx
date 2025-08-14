import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { useColorScheme } from '@/hooks/useColorScheme';
import { socketService } from '@/services/socketService';
import { platformAlert, platformConfirm } from '@/utils/platformAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Supplement {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
  created_at: string;
  type: string; // 'supplement' or 'medication'
  supplement_info?: {
    generic_name: string;
    brand_names: string[];
    description: string;
    typical_dosage_range: string;
    common_uses: string[];
  };
}

interface User {
  id: number;
  fullName: string;
  email: string;
  userType: string;
}

export default function PatientSupplementsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { patientId, patientName } = useLocalSearchParams<{
    patientId: string;
    patientName: string;
  }>();

  const [user, setUser] = useState<User | null>(null);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [medications, setMedications] = useState<Supplement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);
  const [newSupplement, setNewSupplement] = useState({
    name: '',
    dosage: '',
    frequency: '',
    notes: '',
    type: 'supplement'
  });

  const getCurrentUser = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        return parsedUser;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    return null;
  }, []);

  const fetchSupplements = useCallback(async () => {
    try {
      const response = await fetch(`${Config.API_URL}/api/doctor-patient/patient-supplements/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setSupplements(data.supplements || []);
        setMedications(data.medications || []);
      } else {
        console.error('Failed to fetch supplements');
      }
    } catch (error) {
      console.error('Error fetching supplements:', error);
    }
  }, [patientId]);

  // Socket.IO real-time event handlers
  const setupSocketListeners = useCallback((userId: number) => {
    socketService.connect(userId);
    
    // Set up real-time event listener for patient supplement updates
    const handlePatientSupplementsUpdate = (data: any) => {
      console.log('Real-time event received:', data);
      console.log('Current patientId:', patientId, 'Event patientId:', data.patientId);
      
      // Only refresh if this event is for the current patient being viewed
      // Compare both as strings and numbers to handle type mismatches
      if (data.patientId == patientId || data.patientId === parseInt(patientId)) {
        console.log('Real-time: Patient supplements updated for patient:', patientId);
        fetchSupplements();
      } else {
        console.log('Real-time: Event not for current patient, ignoring');
      }
    };

    // Register event listener
    socketService.onPatientSupplementsUpdated(handlePatientSupplementsUpdate);

    // Cleanup function
    return () => {
      socketService.offPatientSupplementsUpdated(handlePatientSupplementsUpdate);
    };
  }, [patientId, fetchSupplements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSupplements();
    setRefreshing(false);
  }, [fetchSupplements]);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  // Set up Socket.IO connections when user is available
  useEffect(() => {
    if (user?.id) {
      console.log('Setting up socket listeners for doctor:', user.id, 'viewing patient:', patientId);
      const cleanup = setupSocketListeners(user.id);
      
      return () => {
        console.log('Cleaning up socket listeners for doctor:', user.id);
        cleanup();
        socketService.disconnect();
      };
    }
  }, [user?.id, setupSocketListeners]);

  useFocusEffect(
    useCallback(() => {
      fetchSupplements();
    }, [fetchSupplements])
  );

  const handleAddSupplement = async () => {
    if (!newSupplement.name.trim() || !newSupplement.dosage.trim() || !newSupplement.frequency.trim()) {
      platformAlert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${Config.API_URL}/supplements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_uid: patientId,
          name: newSupplement.name,
          dosage: newSupplement.dosage,
          frequency: newSupplement.frequency,
          first_take: new Date().toISOString(),
          supply_amount: 30,
          type: newSupplement.type
        }),
      });

      if (response.ok) {
        platformAlert('Success', 'Supplement added successfully');
        setNewSupplement({ name: '', dosage: '', frequency: '', notes: '', type: 'supplement' });
        setShowAddModal(false);
        fetchSupplements();
      } else {
        platformAlert('Error', 'Failed to add supplement');
      }
    } catch (error) {
      console.error('Error adding supplement:', error);
      platformAlert('Error', 'Failed to add supplement');
    }
  };

  const handleEditSupplement = async () => {
    if (!selectedSupplement) return;

    try {
      const response = await fetch(`${Config.API_URL}/supplements/${selectedSupplement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSupplement.name,
          dosage: newSupplement.dosage,
          frequency: newSupplement.frequency,
          first_take: selectedSupplement.created_at,
          supply_amount: 30,
          type: 'supplement'
        }),
      });

      if (response.ok) {
        platformAlert('Success', 'Supplement updated successfully');
        setShowEditModal(false);
        setSelectedSupplement(null);
        fetchSupplements();
      } else {
        platformAlert('Error', 'Failed to update supplement');
      }
    } catch (error) {
      console.error('Error updating supplement:', error);
      platformAlert('Error', 'Failed to update supplement');
    }
  };

  const handleDeleteSupplement = async (supplementId: number) => {
    platformConfirm(
      'Delete Supplement',
      'Are you sure you want to delete this supplement?',
      async () => {
        try {
          const response = await fetch(`${Config.API_URL}/supplements/${supplementId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            platformAlert('Success', 'Supplement deleted successfully');
            fetchSupplements();
          } else {
            platformAlert('Error', 'Failed to delete supplement');
          }
        } catch (error) {
          console.error('Error deleting supplement:', error);
          platformAlert('Error', 'Failed to delete supplement');
        }
      }
    );
  };

  const openEditModal = (supplement: Supplement) => {
    setSelectedSupplement(supplement);
    setNewSupplement({
      name: supplement.name,
      dosage: supplement.dosage,
      frequency: supplement.frequency,
      notes: supplement.notes || '',
      type: supplement.type
    });
    setShowEditModal(true);
  };

  const renderSupplement = ({ item }: { item: Supplement }) => (
    <View style={[styles.supplementCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.supplementHeader}>
        <Text style={[styles.supplementName, { color: colors.text }]}>
          {item.name}
        </Text>
        {isEditMode && (
          <View style={styles.editActions}>
            <Pressable
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={() => openEditModal(item)}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </Pressable>
            <Pressable
              style={[styles.deleteButton, { backgroundColor: colors.danger }]}
              onPress={() => handleDeleteSupplement(item.id)}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </Pressable>
          </View>
        )}
      </View>
      <Text style={[styles.supplementDosage, { color: colors.tabIconDefault }]}>
        Dosage: {item.dosage}
      </Text>
      <Text style={[styles.supplementFrequency, { color: colors.tabIconDefault }]}>
        Frequency: {item.frequency}
      </Text>
      {item.notes && (
        <Text style={[styles.supplementNotes, { color: colors.tabIconDefault }]}>
          Notes: {item.notes}
        </Text>
      )}
      <Text style={[styles.supplementDate, { color: colors.tabIconDefault }]}>
        Added: {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  if (!user || user.userType !== 'doctor') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
          </TouchableOpacity>
          <ThemedText type="title" style={[styles.headerTitle, { color: colors.text }]}>
            Unauthorized
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.content}>
          <ThemedText style={[styles.errorText, { color: colors.text }]}>
            This page is only available for doctors.
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ThemedText type="title" style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {patientName}
          </ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.buttonText}>Add Supplement/Medication</Text>
          </Pressable>
          <Pressable
            style={[styles.editModeButton, {
              backgroundColor: isEditMode ? colors.danger : colors.tabIconDefault
            }]}
            onPress={() => setIsEditMode(!isEditMode)}
          >
            <Text style={styles.buttonText}>
              {isEditMode ? 'Done' : 'Edit'}
            </Text>
          </Pressable>
        </View>

        {/* Supplements Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Supplements
          </Text>
          {supplements.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              No supplements added yet
            </Text>
          ) : (
            <FlatList
              data={supplements}
              renderItem={renderSupplement}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Medications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Medications
          </Text>
          {medications.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              No medications added yet
            </Text>
          ) : (
            <FlatList
              data={medications}
              renderItem={renderSupplement}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Add Supplement Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add New Item
            </Text>
            
            {/* Type Selector */}
            <View style={styles.typeSelector}>
              <Text style={[styles.typeSelectorLabel, { color: colors.text }]}>Type:</Text>
              <View style={styles.typeSelectorButtons}>
                <Pressable
                  style={[
                    styles.typeSelectorButton,
                    {
                      backgroundColor: newSupplement.type === 'supplement' ? colors.primary : colors.tabIconDefault,
                    }
                  ]}
                  onPress={() => setNewSupplement(prev => ({ ...prev, type: 'supplement' }))}
                >
                  <Text style={styles.buttonText}>Supplement</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.typeSelectorButton,
                    {
                      backgroundColor: newSupplement.type === 'medication' ? colors.primary : colors.tabIconDefault,
                    }
                  ]}
                  onPress={() => setNewSupplement(prev => ({ ...prev, type: 'medication' }))}
                >
                  <Text style={styles.buttonText}>Medication</Text>
                </Pressable>
              </View>
            </View>
            
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Supplement Name"
              placeholderTextColor={colors.tabIconDefault}
              value={newSupplement.name}
              onChangeText={(text) => setNewSupplement(prev => ({ ...prev, name: text }))}
            />
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Dosage (e.g., 500mg)"
              placeholderTextColor={colors.tabIconDefault}
              value={newSupplement.dosage}
              onChangeText={(text) => setNewSupplement(prev => ({ ...prev, dosage: text }))}
            />
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Frequency (e.g., Once daily)"
              placeholderTextColor={colors.tabIconDefault}
              value={newSupplement.frequency}
              onChangeText={(text) => setNewSupplement(prev => ({ ...prev, frequency: text }))}
            />
            <TextInput
              style={[styles.input, styles.textArea, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.tabIconDefault}
              value={newSupplement.notes}
              onChangeText={(text) => setNewSupplement(prev => ({ ...prev, notes: text }))}
              multiline={true}
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.tabIconDefault }]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewSupplement({ name: '', dosage: '', frequency: '', notes: '', type: 'supplement' });
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddSupplement}
              >
                <Text style={styles.buttonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Supplement Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit Item
            </Text>
            
            {/* Type Selector */}
            <View style={styles.typeSelector}>
              <Text style={[styles.typeSelectorLabel, { color: colors.text }]}>Type:</Text>
              <View style={styles.typeSelectorButtons}>
                <Pressable
                  style={[
                    styles.typeSelectorButton,
                    {
                      backgroundColor: newSupplement.type === 'supplement' ? colors.primary : colors.tabIconDefault,
                    }
                  ]}
                  onPress={() => setNewSupplement(prev => ({ ...prev, type: 'supplement' }))}
                >
                  <Text style={styles.buttonText}>Supplement</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.typeSelectorButton,
                    {
                      backgroundColor: newSupplement.type === 'medication' ? colors.primary : colors.tabIconDefault,
                    }
                  ]}
                  onPress={() => setNewSupplement(prev => ({ ...prev, type: 'medication' }))}
                >
                  <Text style={styles.buttonText}>Medication</Text>
                </Pressable>
              </View>
            </View>
            
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Supplement Name"
              placeholderTextColor={colors.tabIconDefault}
              value={newSupplement.name}
              onChangeText={(text) => setNewSupplement(prev => ({ ...prev, name: text }))}
            />
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Dosage (e.g., 500mg)"
              placeholderTextColor={colors.tabIconDefault}
              value={newSupplement.dosage}
              onChangeText={(text) => setNewSupplement(prev => ({ ...prev, dosage: text }))}
            />
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Frequency (e.g., Once daily)"
              placeholderTextColor={colors.tabIconDefault}
              value={newSupplement.frequency}
              onChangeText={(text) => setNewSupplement(prev => ({ ...prev, frequency: text }))}
            />
            <TextInput
              style={[styles.input, styles.textArea, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.tabIconDefault}
              value={newSupplement.notes}
              onChangeText={(text) => setNewSupplement(prev => ({ ...prev, notes: text }))}
              multiline={true}
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.tabIconDefault }]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedSupplement(null);
                  setNewSupplement({ name: '', dosage: '', frequency: '', notes: '', type: 'supplement' });
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleEditSupplement}
              >
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16, // reduce from 20 for safer edge
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 80, // Ensure minimum width for back button
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 10, // Add margin to prevent collision
  },
  headerTitle: {
    fontSize: 16, // Slightly smaller to fit better
    fontWeight: 'bold',
    textAlign: 'center',
    flexShrink: 1, // Allow text to shrink if needed
  },
  placeholder: {
    minWidth: 80, // Match back button minimum width for balance
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editModeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  supplementCard: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  supplementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  supplementName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  supplementDosage: {
    fontSize: 14,
    marginBottom: 4,
  },
  supplementFrequency: {
    fontSize: 14,
    marginBottom: 4,
  },
  supplementNotes: {
    fontSize: 14,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  supplementDate: {
    fontSize: 12,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {},
  saveButton: {},
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  typeSelector: {
    marginBottom: 20,
  },
  typeSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  typeSelectorButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeSelectorButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
});
