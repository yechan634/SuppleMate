import { socketService } from '@/services/socketService';
import { platformAlert } from '@/utils/platformAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';


import DosageRecommendationModal from '@/components/DosageRecommendationModal';
import DosageWarningModal from '@/components/DosageWarningModal';
import InteractionModal from '@/components/InteractionModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { InteractionResult, InteractionSeverity } from '@/constants/DrugInteractions';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DosageValidationResult, getSupplementDosageRanges, PersonalInfo, SupplementDosageInfo, validateDosageRange } from '@/utils/DosageCalculator';
import { getUserPersonalInfo, hasRequiredPersonalInfo } from '@/utils/UserDataUtils';

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
  approval_status?: string; // Add approval status
  created_at: string;
  updated_at: string;
};

// Doctor response notification type
type DoctorResponseNotification = {
  id: number;
  patient_id: number;
  doctor_id: number;
  approval_request_id: number;
  doctor_name: string;
  supplement_name: string;
  response_type: 'approved' | 'rejected';
  doctor_notes: string | null;
  created_at: string;
};

// Approval request type
type ApprovalRequest = {
  id: number;
  patient_id: number;
  doctor_id: number;
  patient_name: string;
  supplement_name: string;
  dosage: string;
  frequency: string;
  first_take: string;
  supply_amount: number;
  type: 'supplement' | 'medication';
  status: 'pending' | 'approved' | 'rejected';
  interaction_info: any;
  request_reason: 'interaction' | 'medication';
  notes?: string;
  doctor_response_notes?: string;
  created_at: string;
  responded_at?: string;
  doctor_name: string;
  doctor_email: string;
};

// Pending add data type
type PendingAddData = {
  name: string;
  dosage: string;
  frequency: string;
  firstTake: Date;
  supplyAmount: string;
  addingType: 'supplement' | 'medication';
};

export default function ManageSupplementsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [medications, setMedications] = useState<Supplement[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingType, setAddingType] = useState<'supplement' | 'medication'>('supplement');

  // Doctor response notifications state
  const [doctorNotifications, setDoctorNotifications] = useState<DoctorResponseNotification[]>([]);

  // Pending approval requests state
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);

  // Interaction modal states
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionResult, setInteractionResult] = useState<InteractionResult | null>(null);
  const [pendingAddData, setPendingAddData] = useState<PendingAddData | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [firstTake, setFirstTake] = useState(new Date());
  const [supplyAmount, setSupplyAmount] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // autocomplete states
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Dosage recommendation states
  const [showDosageModal, setShowDosageModal] = useState(false);
  const [dosageInfo, setDosageInfo] = useState<SupplementDosageInfo | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);

  // Dosage warning states
  const [showDosageWarningModal, setShowDosageWarningModal] = useState(false);
  const [dosageValidationResult, setDosageValidationResult] = useState<DosageValidationResult | null>(null);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSupplements(); // Always call to load user data and supplements
    }, [])
  );

  const [socketListenersSetup, setSocketListenersSetup] = useState(false);

  // Handle Socket.IO cleanup on unmount
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://supplemate-api2.impaas.uk/supplement-names`
      );
      if (!response.ok) throw new Error('Failed to fetch suggestions');

      const data = await response.json();
      // Filter suggestions based on input
      const filteredSuggestions = data.names.filter((name: string) =>
        name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const fetchSupplements = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        await fetchSupplementsData(user.id);
        await fetchDoctorNotifications(user.id);
        await fetchPendingRequests(user.id);

        // Set up Socket.IO listeners for this user only once
        if (!socketListenersSetup) {
          setupSocketListeners(user.id);
          setSocketListenersSetup(true);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Socket.IO real-time event handlers
  const setupSocketListeners = useCallback((userIdParam: string) => {
    socketService.connect(parseInt(userIdParam));

    // Set up real-time event listeners
    const handleSupplementsUpdate = () => {
      console.log('Real-time: Supplements updated');
      fetchSupplementsData(userIdParam);
    };

    const handlePendingRequestsUpdate = () => {
      console.log('Real-time: Pending requests updated');
      fetchPendingRequests(userIdParam);
    };

    const handleDoctorResponseNotification = (data: any) => {
      console.log('Real-time: Doctor response notification received', data);

      // Only update the notifications list, don't show immediate alert
      // The alert will be shown when the user views the notification in the UI
      fetchDoctorNotifications(userIdParam);
    };

    // Register event listeners
    socketService.onSupplementsUpdated(handleSupplementsUpdate);
    socketService.onPendingRequestsUpdated(handlePendingRequestsUpdate);
    socketService.onDoctorResponseNotification(handleDoctorResponseNotification);

    // Cleanup function
    return () => {
      socketService.offSupplementsUpdated(handleSupplementsUpdate);
      socketService.offPendingRequestsUpdated(handlePendingRequestsUpdate);
      socketService.offDoctorResponseNotification(handleDoctorResponseNotification);
    };
  }, []);

  const fetchSupplementsData = async (userIdParam?: string) => {
    try {
      const currentUserId = userIdParam || userId;
      if (!currentUserId) {
        console.log('No user ID available, skipping fetch');
        return;
      }

      console.log('Fetching supplements for user ID:', currentUserId);
      const response = await fetch(
        `${Config.API_URL}/supplements?user_uid=${currentUserId}`
      );

      if (!response.ok) throw new Error('Failed to fetch supplements');

      const data: Supplement[] = await response.json();
      console.log('Fetched supplements data:', data);

      // Separate supplements from medications
      const supplementsList = data.filter(item => item.type === 'supplement');
      const medicationsList = data.filter(item => item.type === 'medication');

      console.log('Supplements list:', supplementsList);
      console.log('Medications list:', medicationsList);

      setSupplements(supplementsList);
      setMedications(medicationsList);
    } catch (error) {
      console.error('Error fetching supplements:', error);
      // If there's an error, just set empty arrays
      setSupplements([]);
      setMedications([]);
    }
  };

  const fetchDoctorNotifications = async (userIdParam?: string) => {
    try {
      const currentUserId = userIdParam || userId;
      if (!currentUserId) {
        console.log('No user ID available, skipping notifications fetch');
        return;
      }

      console.log('Fetching doctor notifications for user ID:', currentUserId);
      const response = await fetch(
        `${Config.API_URL}/api/doctor-patient/response-notifications/${currentUserId}`
      );

      if (!response.ok) throw new Error('Failed to fetch doctor notifications');

      const data: DoctorResponseNotification[] = await response.json();
      console.log('Fetched doctor notifications:', data);

      setDoctorNotifications(data);
    } catch (error) {
      console.error('Error fetching doctor notifications:', error);
      setDoctorNotifications([]);
    }
  };

  const fetchPendingRequests = async (userIdParam?: string) => {
    try {
      const currentUserId = userIdParam || userId;
      if (!currentUserId) {
        console.log('No user ID available, skipping pending requests fetch');
        return;
      }

      console.log('Fetching pending requests for user ID:', currentUserId);
      const response = await fetch(
        `${Config.API_URL}/api/doctor-patient/patient-pending-requests/${currentUserId}`
      );

      if (!response.ok) throw new Error('Failed to fetch pending requests');

      const data: ApprovalRequest[] = await response.json();
      console.log('Fetched pending requests:', data);

      setPendingRequests(data);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setPendingRequests([]);
    }
  };

  const handleDiscardNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`${Config.API_URL}/api/doctor-patient/response-notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove notification from local state
        setDoctorNotifications(prev => prev.filter(notification => notification.id !== notificationId));
        platformAlert('Success', 'Notification discarded');
      } else {
        platformAlert('Error', 'Failed to discard notification');
      }
    } catch (error) {
      console.error('Error discarding notification:', error);
      platformAlert('Error', 'Failed to discard notification');
    }
  };

  const handleCancelPendingRequest = async (requestId: number) => {
    try {
      const response = await fetch(`${Config.API_URL}/api/doctor-patient/cancel-approval-request/${requestId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove request from local state
        setPendingRequests(prev => prev.filter(request => request.id !== requestId));
        // Refresh supplements data to remove the pending supplement
        await fetchSupplementsData();
        platformAlert('Success', 'Request cancelled successfully');
      } else {
        platformAlert('Error', 'Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      platformAlert('Error', 'Failed to cancel request');
    }
  };

  const deleteItem = async (id: number) => {
    console.log('deleteItem called with id:', id);

    try {
      console.log('Deleting from API...');
      const response = await fetch(`${Config.API_URL}/supplements/${id}`, {
        method: 'DELETE',
      });

      console.log('Delete API response status:', response.status);
      if (!response.ok) throw new Error('Failed to delete supplement');

      const result = await response.json();
      console.log('Delete API response:', result);

      // Refresh the list
      await fetchSupplementsData();

      // Show success message
      platformAlert('Success', 'Item deleted successfully!');
      console.log('Delete operation completed successfully');
    } catch (error) {
      console.error('Error deleting supplement:', error);
      platformAlert('Error', 'Failed to delete item');
    }
  };

  const checkForDrugInteractions = async (newItemName: string): Promise<InteractionResult> => {
    // Get all current drug names (both supplements and medications)
    const allCurrentDrugs = [...supplements, ...medications].map(item => item.name);

    if (allCurrentDrugs.length === 0) {
      // No existing drugs to check against
      return {
        hasInteractions: false,
        severity: null,
        interactions: []
      };
    }

    console.log(`🔍 Checking API interactions for ${newItemName} against ${allCurrentDrugs.length} existing drugs`);

    const foundInteractions: {
      conflictingDrug: string;
      severity: InteractionSeverity;
      description: string;
    }[] = [];

    let maxSeverity: InteractionSeverity | null = null;

    // Check each existing drug against the new drug using the API endpoint
    for (const existingDrug of allCurrentDrugs) {
      try {
        console.log(`  📡 API call: ${newItemName} + ${existingDrug}`);

        const response = await fetch(`${Config.API_URL}/drug-interactions/${encodeURIComponent(newItemName)}/${encodeURIComponent(existingDrug)}`);

        if (!response.ok) {
          console.warn(`Failed to check interaction between ${newItemName} and ${existingDrug}`);
          continue;
        }

        const apiResult = await response.json();
        console.log(`  📊 API result:`, apiResult);

        // Check if there's an actual interaction (not 'none')
        if (apiResult.severity && apiResult.severity !== 'none') {
          // Map API severity to our InteractionSeverity type
          let mappedSeverity: InteractionSeverity;
          if (apiResult.severity === 'severe' || apiResult.severity === 'moderate') {
            mappedSeverity = 'strong';
          } else {
            mappedSeverity = 'mild';
          }

          foundInteractions.push({
            conflictingDrug: existingDrug,
            severity: mappedSeverity,
            description: apiResult.description || `Interaction detected between ${newItemName} and ${existingDrug}`
          });

          // Update max severity (strong > mild)
          if (maxSeverity === null || (mappedSeverity === 'strong' && maxSeverity === 'mild')) {
            maxSeverity = mappedSeverity;
          }

          console.log(`  ⚠️ Interaction found: ${existingDrug} (${mappedSeverity})`);
        } else {
          console.log(`  ✅ No interaction: ${existingDrug}`);
        }
      } catch (error) {
        console.error(`Error checking interaction between ${newItemName} and ${existingDrug}:`, error);
        // Continue with other drugs even if one fails
      }
    }

    const result = {
      hasInteractions: foundInteractions.length > 0,
      severity: maxSeverity,
      interactions: foundInteractions
    };

    console.log(`🔍 Final interaction result for ${newItemName}:`, result);
    return result;
  };

  const addSupplement = async () => {
    console.log('addSupplement called with:', { name, dosage, frequency, supplyAmount });

    if (!name || !dosage || !frequency) {
      platformAlert('Error', 'Please fill in all required fields');
      return;
    }

    // Create the data object locally
    const newData = { name, dosage, frequency, firstTake, supplyAmount, addingType };

    // Store the pending data for later use if needed
    setPendingAddData(newData);

    // Check dosage FIRST if user has profile info
    if (await hasRequiredPersonalInfo()) {
      try {
        const userPersonalInfo = await getUserPersonalInfo();
        if (userPersonalInfo) {
          const validation = validateDosageRange(dosage, name, userPersonalInfo);

          if (validation && !validation.isValid) {
            // Show dosage warning modal FIRST
            setDosageValidationResult(validation);
            setShowDosageWarningModal(true);
            return; // Stop here, let user decide
          }
        }
      } catch (error) {
        console.error('Error validating dosage:', error);
        // Continue with interaction check if validation fails
      }
    }

    // Only proceed to interaction check if dosage validation passed or no profile info
    // Pass the fresh data directly instead of relying on state
    await proceedToInteractionCheck(newData);
  };

  const proceedToInteractionCheck = async (dataToCheck?: PendingAddData) => {
    // Check drug interactions after dosage validation passes
    // Use the passed data or fall back to state (for backward compatibility)
    const dataToUse = dataToCheck || pendingAddData;

    if (!dataToUse) {
      console.error('No data available for interaction check');
      return;
    }

    try {
      console.log('🔍 Starting interaction check...');
      const interactionCheck = await checkForDrugInteractions(dataToUse.name);
      console.log('✅ Interaction check completed:', interactionCheck);
      setInteractionResult(interactionCheck);
      setShowInteractionModal(true);
    } catch (error) {
      console.error('❌ Error during interaction check:', error);
      // Still show the modal but with no interactions if API fails
      setInteractionResult({
        hasInteractions: false,
        severity: null,
        interactions: []
      });
      setShowInteractionModal(true);
    }
  };

  const proceedWithAdd = async () => {
    console.log('proceedWithAdd called');

    if (!pendingAddData) {
      console.error('No pending data found');
      return;
    }

    // Dosage validation has already been handled in addSupplement()
    // Proceed directly with actual addition
    await performActualAdd();
  };

  const performActualAdd = async () => {
    if (!pendingAddData) {
      console.error('No pending data found');
      return;
    }

    const { name: itemName, dosage: itemDosage, frequency: itemFrequency, firstTake: itemFirstTake, supplyAmount: itemSupplyAmount, addingType: itemType } = pendingAddData;

    // Database expects frequency as a string, not an object
    const payload = {
      user_uid: userId,
      name: itemName,
      dosage: itemDosage,
      frequency: itemFrequency, // Send as string directly
      first_take: itemFirstTake.toISOString(),
      supply_amount: parseInt(itemSupplyAmount, 10) || 1,
      type: itemType
    };

    console.log('Payload to send:', payload);

    try {
      console.log('Sending to API...');
      const response = await fetch(`${Config.API_URL}/supplements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      console.log('API response status:', response.status);
      if (!response.ok) throw new Error('Failed to add supplement');

      const result = await response.json();
      console.log('API response data:', result);

      // Check if approval is required
      if (result.approval_required) {
        // Show success message for approval request
        resetForm();
        setShowAddModal(false);
        setShowInteractionModal(false);
        setShowDosageWarningModal(false);
        setPendingAddData(null);
        setInteractionResult(null);
        setDosageValidationResult(null);

        // Refresh the list to show pending item
        await fetchSupplements();

        platformAlert(
          'Approval Required',
          result.message || 'Your request has been sent to your primary doctor for approval.'
        );
        return;
      }

      // Reset form and close modals
      resetForm();
      setShowAddModal(false);
      setShowInteractionModal(false);
      setShowDosageWarningModal(false);
      setPendingAddData(null);
      setInteractionResult(null);
      setDosageValidationResult(null);

      // Refresh the list
      await fetchSupplements();

      // Show success message for no interactions or after user decided to add anyway
      if (!interactionResult?.hasInteractions) {
        platformAlert('Success', `${itemName} has been added successfully!`);
      } else {
        platformAlert('Added', `${itemName} has been added to your list.`);
      }

      console.log('Add operation completed successfully');
    } catch (error) {
      console.error('Error adding supplement:', error);
      platformAlert('Error', 'Failed to add supplement');
    }
  };

  const resetForm = () => {
    setName('');
    setDosage('');
    setFrequency('');
    setFirstTake(new Date());
    setSupplyAmount('');
    setShowDosageWarningModal(false);
    setDosageValidationResult(null);
  };

  // Handle dosage recommendation
  const handleDosageRecommendation = async () => {
    if (!name.trim()) {
      platformAlert('Error', 'Please enter a supplement name first');
      return;
    }

    try {
      // Check if user has required personal info
      if (!hasRequiredPersonalInfo()) {
        platformAlert(
          'Profile Required',
          'Please complete your profile with gender and weight information to get dosage recommendations.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Profile', onPress: () => router.push('/profile') }
          ]
        );
        return;
      }

      // Get user personal info
      const userInfo = await getUserPersonalInfo();
      if (!userInfo) {
        platformAlert('Error', 'Unable to load your profile information');
        return;
      }

      // Get dosage ranges for the supplement
      const supplementDosageInfo = getSupplementDosageRanges(name);
      if (!supplementDosageInfo) {
        platformAlert(
          'No Recommendations Available',
          `Sorry, we don't have dosage recommendations for "${name}" yet. You can still add it manually.`
        );
        return;
      }

      // Set the data and show modal
      setPersonalInfo(userInfo);
      setDosageInfo(supplementDosageInfo);
      setShowDosageModal(true);
    } catch (error) {
      console.error('Error loading dosage recommendations:', error);
      platformAlert('Error', 'Failed to load dosage recommendations');
    }
  };

  const handleSelectDosage = (selectedDosage: string) => {
    setDosage(selectedDosage);
    setShowDosageModal(false);
  };

  // Modal handlers for drug interactions
  const handleAddAnyway = () => {
    proceedWithAdd();
  };

  const handleDontAdd = () => {
    setShowInteractionModal(false);
    setPendingAddData(null);
    setInteractionResult(null);
  };

  // Modal handlers for dosage warnings
  const handleAddAnywayDosage = async () => {
    setShowDosageWarningModal(false);
    setDosageValidationResult(null);

    // Now check for drug interactions since dosage was approved
    // Use pendingAddData to pass fresh data directly
    if (pendingAddData) {
      await proceedToInteractionCheck(pendingAddData);
    }
  };

  const handleChangeDosage = () => {
    setShowDosageWarningModal(false);
    setDosageValidationResult(null);
    setPendingAddData(null);
    setInteractionResult(null);
    // User returns to the add modal to change dosage
    // The add modal is already open, so they can modify the dosage
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFirstTake(selectedDate);
    }
  };

  const formatFrequency = (frequency: string | { days?: number; hours?: number; seconds?: number }): string => {
    if (typeof frequency === 'string') {
      return frequency;
    }
    if (frequency.days) {
      return `${frequency.days} day${frequency.days > 1 ? 's' : ''}`;
    }
    if (frequency.hours) {
      return `${frequency.hours} hour${frequency.hours > 1 ? 's' : ''}`;
    }
    if (frequency.seconds) {
      // Handle the backend bug where hours are stored as seconds
      const value = frequency.seconds;
      if (value <= 168) { // Reasonable range for hours
        return `${value} hour${value > 1 ? 's' : ''}`;
      } else {
        const hours = Math.round(value / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
    }
    return 'Unknown';
  };

  const renderSupplementItem = (item: Supplement) => (
    <View key={item.id} style={[styles.supplementItem, { backgroundColor: colors.background }]}>
      <View style={styles.supplementInfo}>
        <View style={styles.supplementNameContainer}>
          <Text style={[styles.supplementName, { color: colors.text }]}>{item.name}</Text>
          {item.approval_status === 'pending' && (
            <View style={[styles.pendingBadge, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <Text style={[styles.pendingText, { color: colors.warning }]}>Pending Approval</Text>
            </View>
          )}
        </View>
        <Text style={[styles.supplementDetails, { color: colors.icon }]}>
          {item.dosage} • Every {formatFrequency(item.frequency)}
        </Text>
        <Text style={[styles.supplementSupply, { color: colors.icon }]}>
          Supply: {item.supply_amount} units
        </Text>
        {item.approval_status === 'pending' && (
          <Text style={[styles.pendingMessage, { color: colors.warning }]}>
            Waiting for doctor approval...
          </Text>
        )}
      </View>
      <View style={styles.supplementActions}>
        {!isEditMode ? (
          <TouchableOpacity
            style={[styles.infoButton, { backgroundColor: colors.primary + '15' }]}
            onPress={() => {
              console.log('Info button pressed for:', item.name);
              router.push(`/supplement-info?name=${encodeURIComponent(item.name)}`);
            }}
          >
            <Text style={[styles.infoButtonText, { color: colors.primary }]}>i</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteItem(item.id)}
            disabled={item.approval_status === 'pending'} // Disable delete for pending items
          >
            <IconSymbol
              name="minus.circle"
              size={24}
              color={item.approval_status === 'pending' ? colors.tabIconDefault : colors.danger}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderAddButton = (type: 'supplement' | 'medication') => (
    <TouchableOpacity
      style={[styles.addButton, { borderColor: colors.primary }]}
      onPress={() => {
        setAddingType(type);
        setShowAddModal(true);
      }}
    >
      <IconSymbol name="plus.circle" size={20} color={colors.primary} />
      <Text style={[styles.addButtonText, { color: colors.primary }]}>
        Add New {type === 'supplement' ? 'Supplement' : 'Medication'}
      </Text>
    </TouchableOpacity>
  );

  const handleNotificationTap = (notification: DoctorResponseNotification) => {
    const responseType = notification.response_type === 'approved' ? 'approved' : 'rejected';
    const message = notification.doctor_notes
      ? `Dr. ${notification.doctor_name} ${responseType} your ${notification.supplement_name} request.\n\nNotes: ${notification.doctor_notes}`
      : `Dr. ${notification.doctor_name} ${responseType} your ${notification.supplement_name} request.`;

    platformAlert(
      `Request ${responseType.charAt(0).toUpperCase() + responseType.slice(1)}`,
      message,
      [
        {
          text: 'OK',
          onPress: () => {
            // Auto-discard the notification after user sees it
            handleDiscardNotification(notification.id);
          }
        }
      ]
    );
  };

  const renderDoctorNotification = (notification: DoctorResponseNotification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: notification.response_type === 'approved' ? colors.success : colors.danger,
          borderLeftWidth: 4
        }
      ]}
      onPress={() => handleNotificationTap(notification)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, {
            color: notification.response_type === 'approved' ? colors.success : colors.danger
          }]}>
            {notification.response_type === 'approved' ? '✅ Request Approved' : '❌ Request Rejected'}
          </Text>
          <Text style={[styles.notificationSubtitle, { color: colors.text }]}>
            <Text style={{ fontWeight: 'bold' }}>{notification.supplement_name}</Text> by Dr. {notification.doctor_name}
          </Text>
          <Text style={[styles.notificationDate, { color: colors.tabIconDefault }]}>
            {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
          </Text>
          {notification.doctor_notes && (
            <View style={[styles.noteBubble, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.noteText, { color: colors.text }]}>
                💬 {notification.doctor_notes}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.discardButton, { backgroundColor: colors.tabIconDefault }]}
          onPress={() => handleDiscardNotification(notification.id)}
        >
          <Text style={styles.discardButtonText}>Discard</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderPendingRequest = (request: ApprovalRequest) => (
    <View
      key={request.id}
      style={[
        styles.notificationCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.warning,
          borderLeftWidth: 4
        }
      ]}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, { color: colors.warning }]}>
            ⏳ Pending Approval
          </Text>
          <Text style={[styles.notificationSubtitle, { color: colors.text }]}>
            <Text style={{ fontWeight: 'bold' }}>{request.supplement_name}</Text>
            {' '}({request.dosage}, every {request.frequency})
          </Text>
          <Text style={[styles.notificationSubtitle, { color: colors.text }]}>
            Waiting for approval from Dr. {request.doctor_name}
          </Text>
          <Text style={[styles.notificationDate, { color: colors.tabIconDefault }]}>
            Requested on {new Date(request.created_at).toLocaleDateString()}
          </Text>
          <Text style={[styles.pendingMessage, { color: colors.tabIconDefault }]}>
            Reason: {request.request_reason === 'interaction' ? 'Drug interaction detected' : 'Medication requires approval'}
          </Text>
          {request.notes && (
            <View style={[styles.noteBubble, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.noteText, { color: colors.text }]}>
                📝 Your note: {request.notes}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.discardButton, { backgroundColor: colors.danger }]}
          onPress={() => handleCancelPendingRequest(request.id)}
        >
          <Text style={styles.discardButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.appName, { color: colors.primary }]}>
          {Config.APP_NAME}
        </ThemedText>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditMode(!isEditMode)}
        >
          <Text style={[styles.editButtonText, { color: colors.primary }]}>
            {isEditMode ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* My Supplement Stack Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="pill" size={24} color={colors.primary} />
            <ThemedText type="subtitle" style={{ color: colors.text }}>
              My Supplement Stack
            </ThemedText>
          </View>

          {supplements.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              No supplements added yet
            </Text>
          ) : (
            supplements.map(renderSupplementItem)
          )}

          {renderAddButton('supplement')}
        </View>

        {/* My Medications Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="heart.fill" size={24} color={colors.danger} />
            <ThemedText type="subtitle" style={{ color: colors.text }}>
              My Medications
            </ThemedText>
          </View>

          {medications.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              No medications added yet
            </Text>
          ) : (
            medications.map(renderSupplementItem)
          )}

          {renderAddButton('medication')}
        </View>

        {/* Doctor Response Notifications Section */}
        {doctorNotifications.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.sectionHeader}>
              <IconSymbol name="bell.fill" size={24} color={colors.primary} />
              <ThemedText type="subtitle" style={{ color: colors.text }}>
                Doctor Responses
              </ThemedText>
            </View>

            {doctorNotifications.map(renderDoctorNotification)}
          </View>
        )}

        {/* Pending Approval Requests Section */}
        {pendingRequests.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.sectionHeader}>
              <IconSymbol name="clock.fill" size={24} color={colors.warning} />
              <ThemedText type="subtitle" style={{ color: colors.text }}>
                Pending Approval Requests
              </ThemedText>
            </View>

            {pendingRequests.map(renderPendingRequest)}
          </View>
        )}
      </ScrollView>

      {/* Add New Item Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
              <Text style={[styles.cancelButton, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
              Add {addingType === 'supplement' ? 'Supplement' : 'Medication'}
            </ThemedText>
            <TouchableOpacity onPress={addSupplement}>
              <Text style={[styles.addButtonModal, { color: colors.primary }]}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Form Fields */}
            <View style={styles.formContainer}>
              <View style={{
                position: 'relative',
                marginBottom: 16,
                zIndex: 1000,
                elevation: 1000
              }}>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.cardBackground,
                    color: colors.text,
                    borderColor: colors.primary,
                    borderBottomLeftRadius: showSuggestions ? 0 : 8,
                    borderBottomRightRadius: showSuggestions ? 0 : 8,
                  }]}
                  placeholder="Name (e.g., Vitamin D)"
                  placeholderTextColor={colors.icon}
                  value={name}  // This should update when setName is called
                  onChangeText={(text) => {
                    setName(text);
                    fetchSuggestions(text);
                  }}
                // onBlur={() => {
                //   // Add small delay to allow onPress to fire first
                //   setTimeout(() => {
                //     setShowSuggestions(false);
                //   }, 100);
                // }}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <TouchableWithoutFeedback>
                    <View>
                      <ScrollView
                        style={[styles.suggestionsBox, {
                          backgroundColor: colors.cardBackground,
                          borderColor: colors.primary,
                        }]}
                        keyboardShouldPersistTaps="handled"
                      >
                        {suggestions.map((suggestion, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[styles.suggestionItem, {
                              borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                              borderBottomColor: colors.border,
                            }]}
                            onPress={() => {
                              // Force immediate update of the text input
                              setName(suggestion);
                              // Clear suggestions immediately after setting name
                              setSuggestions([]);
                              setShowSuggestions(false);
                              // Optional: add debug log
                              console.log('Selected suggestion:', suggestion);
                            }}
                            // Add active opacity for better feedback
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.suggestionText, { color: colors.text }]}>
                              {suggestion}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </TouchableWithoutFeedback>
                )}
              </View>

              {/* Dosage Input with Recommendation Button */}
              <View style={styles.dosageContainer}>
                <TextInput
                  style={[styles.dosageInput, {
                    backgroundColor: colors.cardBackground,
                    color: colors.text,
                    borderColor: colors.primary
                  }]}
                  placeholder="Dosage (e.g., 1000 IU)"
                  placeholderTextColor={colors.icon}
                  value={dosage}
                  onChangeText={setDosage}
                />
                <TouchableOpacity
                  style={[styles.recommendButton, { backgroundColor: colors.primary }]}
                  onPress={handleDosageRecommendation}
                >
                  <IconSymbol name="star.fill" size={16} color="white" />
                  <Text style={styles.recommendButtonText}>Recommend</Text>
                </TouchableOpacity>
              </View>

              {/* Frequency Picker */}
              <View style={[styles.input, {
                backgroundColor: colors.cardBackground,
                borderColor: colors.primary,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }]}>
                <Text style={{ color: frequency ? colors.text : colors.icon }}>
                  {frequency || 'Select frequency...'}
                </Text>
              </View>

              {/* Frequency Options */}
              <View style={styles.frequencyOptions}>
                {['6 hours', '8 hours', '12 hours', '1 day', '2 days', '3 days', '1 week'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyOption,
                      {
                        backgroundColor: frequency === freq ? colors.primary : colors.cardBackground,
                        borderColor: colors.primary
                      }
                    ]}
                    onPress={() => setFrequency(freq)}
                  >
                    <Text style={{
                      color: frequency === freq ? 'white' : colors.text,
                      fontSize: 12
                    }}>
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedView style={styles.datePickerRow}>
                <ThemedText style={{ color: colors.text }}>First intake time: </ThemedText>
                <Button
                  title={firstTake.toLocaleString()}
                  onPress={() => setShowDatePicker(true)}
                />
              </ThemedView>

              {showDatePicker && (
                <DateTimePicker
                  value={firstTake}
                  mode="datetime"
                  onChange={onDateChange}
                />
              )}

              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.primary
                }]}
                placeholder="Supply amount (number of pills/capsules)"
                placeholderTextColor={colors.icon}
                value={supplyAmount}
                onChangeText={setSupplyAmount}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Drug Interaction Modal */}
      <InteractionModal
        visible={showInteractionModal}
        drugName={pendingAddData?.name || ''}
        interactionResult={interactionResult || { hasInteractions: false, severity: null, interactions: [] }}
        onAddAnyway={handleAddAnyway}
        onDontAdd={handleDontAdd}
      />

      {/* Dosage Recommendation Modal */}
      {dosageInfo && personalInfo && (
        <DosageRecommendationModal
          visible={showDosageModal}
          onClose={() => setShowDosageModal(false)}
          onSelectDosage={handleSelectDosage}
          supplementName={name}
          dosageInfo={dosageInfo}
          personalInfo={personalInfo}
          currentDosage={dosage}
        />
      )}

      {/* Dosage Warning Modal */}
      {dosageValidationResult && (
        <DosageWarningModal
          visible={showDosageWarningModal}
          onClose={handleChangeDosage}
          onAddAnyway={handleAddAnywayDosage}
          supplementName={pendingAddData?.name || ''}
          enteredDosage={pendingAddData?.dosage || ''}
          recommendedRange={dosageValidationResult.recommendedRange}
          isAboveRange={dosageValidationResult.isAboveRange}
          isBelowRange={dosageValidationResult.isBelowRange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
    position: 'absolute',
    right: 20,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
    marginBottom: 16,
    gap: 8,
  },
  supplementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  supplementInfo: {
    flex: 1,
  },
  supplementName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  supplementDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  supplementSupply: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  supplementActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  infoButton: {
    padding: 4,
    borderRadius: 12,
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  infoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    fontSize: 16,
  },
  addButtonModal: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // suggestionItem: {
  //   padding: 12,
  //   borderRadius: 8,
  //   borderWidth: 1,
  //   marginBottom: 8,
  //   minWidth: '45%',
  // },
  // suggestionText: {
  //   fontSize: 14,
  //   fontWeight: '600',
  //   marginBottom: 2,
  // },
  suggestionDosage: {
    fontSize: 12,
  },
  formContainer: {
    paddingBottom: 40,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  frequencyOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionsBox: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 1000, // Add this for Android
    shadowColor: '#000', // Add shadow for better visibility
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 16,
  },
  dosageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dosageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  recommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  recommendButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  supplementNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  pendingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pendingMessage: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  notificationCard: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationContent: {
    flex: 1,
    marginRight: 10,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  noteBubble: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  noteText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  discardButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  discardButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
});
