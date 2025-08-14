import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { useColorScheme } from '@/hooks/useColorScheme';
import { socketService } from '@/services/socketService';
import { platformAlert, platformConfirm } from '@/utils/platformAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
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
  View
} from 'react-native';

interface User {
  id: number;
  fullName: string;
  email: string;
  userType: string;
}

interface Patient {
  id: number;
  patient_id: number;
  full_name: string;
  email: string;
  is_primary_doctor: boolean;
  created_at: string;
}

interface Request {
  id: number;
  requester_id: number;
  recipient_id: number;
  request_type: string;
  status: string;
  created_at: string;
  requester_name: string;
  requester_email: string;
  requester_type: string;
  recipient_name?: string;
  recipient_email?: string;
  recipient_type?: string;
}

interface InteractionNotification {
  id: number;
  doctor_id: number;
  patient_id: number;
  patient_name: string;
  added_supplement: string;
  interacting_supplement: string;
  interaction_type: 'mild' | 'strong';
  interaction_description: string;
  created_at: string;
}

interface ApprovalRequest {
  id: number;
  patient_id: number;
  doctor_id: number;
  patient_name: string;
  patient_full_name: string;
  patient_email: string;
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
}

export default function PatientsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [user, setUser] = useState<User | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<Request[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Request[]>([]);
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [notifications, setNotifications] = useState<InteractionNotification[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSendRequestModal, setShowSendRequestModal] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);

  // Response modal states
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [responseType, setResponseType] = useState<'approved' | 'rejected' | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');

  const getCurrentUser = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('Patients page - User data:', parsedUser);
        console.log('Patients page - User type:', parsedUser.userType);
        setUser(parsedUser);
        return parsedUser;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    return null;
  }, []);

  // Socket.IO real-time event handlers
  const setupSocketListeners = useCallback((userId: number) => {
    socketService.connect(userId);
    
    // Set up real-time event listeners
    const handleIncomingRequestsUpdate = () => {
      console.log('Real-time: Incoming requests updated');
      fetchData();
    };

    const handleOutgoingRequestsUpdate = () => {
      console.log('Real-time: Outgoing requests updated');
      fetchData();
    };

    const handleMyPatientsUpdate = () => {
      console.log('Real-time: My patients updated');
      fetchData();
    };

    const handleApprovalRequestsUpdate = () => {
      console.log('Real-time: Approval requests updated');
      fetchData();
    };

    const handleInteractionNotification = (data: any) => {
      console.log('Real-time: New interaction notification received', data);
      fetchData();
      // Show immediate notification to user
      platformAlert(
        'New Drug Interaction Alert',
        `Patient ${data.patient_name} added ${data.added_supplement} which interacts with ${data.interacting_supplement}. Severity: ${data.interaction_type}`
      );
    };

    // Register event listeners
    socketService.onIncomingRequestsUpdated(handleIncomingRequestsUpdate);
    socketService.onOutgoingRequestsUpdated(handleOutgoingRequestsUpdate);
    socketService.onMyPatientsUpdated(handleMyPatientsUpdate);
    socketService.onApprovalRequestsUpdated(handleApprovalRequestsUpdate);
    socketService.onInteractionNotification(handleInteractionNotification);

    // Cleanup function
    return () => {
      socketService.offIncomingRequestsUpdated(handleIncomingRequestsUpdate);
      socketService.offOutgoingRequestsUpdated(handleOutgoingRequestsUpdate);
      socketService.offMyPatientsUpdated(handleMyPatientsUpdate);
      socketService.offApprovalRequestsUpdated(handleApprovalRequestsUpdate);
      socketService.offInteractionNotification(handleInteractionNotification);
    };
  }, []);

  const fetchData = useCallback(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    try {
      // Fetch incoming requests (only pending ones)
      const incomingResponse = await fetch(`${Config.API_URL}/api/doctor-patient/incoming-requests/${currentUser.id}`);
      if (incomingResponse.ok) {
        const incomingData = await incomingResponse.json();
        // Filter to only show pending requests
        const pendingRequests = incomingData.filter((request: Request) => request.status === 'pending');
        setIncomingRequests(pendingRequests);
      }

      // Fetch outgoing requests (only pending ones)
      const outgoingResponse = await fetch(`${Config.API_URL}/api/doctor-patient/outgoing-requests/${currentUser.id}`);
      if (outgoingResponse.ok) {
        const outgoingData = await outgoingResponse.json();
        // Filter to only show pending requests
        const pendingRequests = outgoingData.filter((request: Request) => request.status === 'pending');
        setOutgoingRequests(pendingRequests);
      }

      // Fetch my patients
      const patientsResponse = await fetch(`${Config.API_URL}/api/doctor-patient/patients/${currentUser.id}`);
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setMyPatients(patientsData);
      }

      // Fetch interaction notifications
      const notificationsResponse = await fetch(`${Config.API_URL}/api/doctor-patient/notifications/${currentUser.id}`);
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData);
      }

      // Fetch approval requests
      const approvalResponse = await fetch(`${Config.API_URL}/api/doctor-patient/approval-requests/${currentUser.id}`);
      if (approvalResponse.ok) {
        const approvalData = await approvalResponse.json();
        setApprovalRequests(approvalData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [getCurrentUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up Socket.IO connections when user is available
  useEffect(() => {
    if (user?.id) {
      const cleanup = setupSocketListeners(user.id);
      
      return () => {
        cleanup();
        socketService.disconnect();
      };
    }
  }, [user?.id, setupSocketListeners]);

  const handleSendRequest = async () => {
    if (!patientId.trim() || !user) {
      platformAlert('Error', 'Please enter a patient ID');
      return;
    }

    setLoading(true);
    try {
      // First, check if the patient exists
      const findResponse = await fetch(`${Config.API_URL}/api/users/find/${patientId}`);
      if (!findResponse.ok) {
        platformAlert('Error', 'Patient not found');
        return;
      }

      const patientData = await findResponse.json();
      if (patientData.user_type !== 'supplement_user') {
        platformAlert('Error', 'User is not a supplement user');
        return;
      }

      // Send the request
      const response = await fetch(`${Config.API_URL}/api/doctor-patient/send-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterId: user.id,
          recipientId: parseInt(patientId),
          requestType: 'doctor_to_patient'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        platformAlert('Success', 'Request sent successfully');
        setPatientId('');
        setShowSendRequestModal(false);
        fetchData();
      } else {
        // Provide more helpful error messages
        let errorMessage = result.error || 'Failed to send request';
        
        if (result.error === 'Relationship already exists') {
          errorMessage = 'You are already connected to this patient. Check your "My Patients" section.';
        } else if (result.error === 'Pending request already exists') {
          errorMessage = 'You already have a pending request to this patient. Please wait for their response.';
        }
        
        platformAlert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error sending request:', error);
      platformAlert('Error', 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: number, response: 'accepted' | 'rejected') => {
    try {
      const apiResponse = await fetch(`${Config.API_URL}/api/doctor-patient/respond-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          response
        }),
      });

      const result = await apiResponse.json();

      if (apiResponse.ok) {
        platformAlert('Success', `Request ${response} successfully`);
        fetchData();
      } else {
        platformAlert('Error', result.error || `Failed to ${response} request`);
      }
    } catch (error) {
      console.error(`Error ${response} request:`, error);
      platformAlert('Error', `Failed to ${response} request`);
    }
  };

  const handleRemovePatient = async (relationshipId: number) => {
    platformConfirm(
      'Remove Patient',
      'Are you sure you want to remove this patient?',
      async () => {
        try {
          const response = await fetch(`${Config.API_URL}/api/doctor-patient/relationship/${relationshipId}`, {
            method: 'DELETE',
          });

          const result = await response.json();

          if (response.ok) {
            platformAlert('Success', 'Patient removed successfully');
            fetchData();
          } else {
            platformAlert('Error', result.error || 'Failed to remove patient');
          }
        } catch (error) {
          console.error('Error removing patient:', error);
          platformAlert('Error', 'Failed to remove patient');
        }
      }
    );
  };

  const handleViewPatient = (patient: Patient) => {
    // Navigate to patient supplement stack view
    router.push({
      pathname: '/patient-supplements',
      params: {
        patientId: patient.patient_id.toString(),
        patientName: patient.full_name
      }
    });
  };

  const handleDismissNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`${Config.API_URL}/api/doctor-patient/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove notification from local state
        setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
        platformAlert('Success', 'Notification dismissed');
      } else {
        platformAlert('Error', 'Failed to dismiss notification');
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
      platformAlert('Error', 'Failed to dismiss notification');
    }
  };

  const handleApprovalResponse = async (requestId: number, response: 'approved' | 'rejected', notes?: string) => {
    try {
      const apiResponse = await fetch(`${Config.API_URL}/api/doctor-patient/respond-approval-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalRequestId: requestId,
          response: response,
          doctorNotes: notes || ''
        }),
      });

      const result = await apiResponse.json();

      if (apiResponse.ok) {
        platformAlert('Success', `Supplement request ${response} successfully`);
        // Remove approval request from local state
        setApprovalRequests(prev => prev.filter(request => request.id !== requestId));
        fetchData(); // Refresh all data
      } else {
        platformAlert('Error', result.error || `Failed to ${response} request`);
      }
    } catch (error) {
      console.error(`Error ${response} approval request:`, error);
      platformAlert('Error', `Failed to ${response} request`);
    }
  };

  const renderApprovalRequest = ({ item }: { item: ApprovalRequest }) => (
    <View style={[styles.approvalCard, { 
      backgroundColor: colors.cardBackground, 
      borderColor: item.request_reason === 'interaction' ? colors.warning : colors.primary,
      borderLeftWidth: 4
    }]}>
      <View style={styles.approvalHeader}>
        <View style={styles.approvalTitleContainer}>
          <Text style={[styles.approvalTitle, { color: colors.text }]}>
            {item.request_reason === 'interaction' ? '🔄 Interaction Alert' : '💊 Medication Request'}
          </Text>
          <Text style={[styles.approvalDate, { color: colors.tabIconDefault }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.approvalContent}>
        <Text style={[styles.patientInfo, { color: colors.text }]}>
          Patient: <Text style={{ fontWeight: 'bold' }}>{item.patient_full_name}</Text>
        </Text>
        <Text style={[styles.supplementInfo, { color: colors.text }]}>
          Wants to add: <Text style={{ fontWeight: 'bold' }}>{item.supplement_name}</Text>
        </Text>
        <Text style={[styles.supplementInfo, { color: colors.text }]}>
          Type: <Text style={{ fontWeight: 'bold', color: item.type === 'medication' ? colors.primary : colors.text }}>
            {item.type === 'medication' ? 'Medication' : 'Supplement'}
          </Text>
        </Text>
        <Text style={[styles.supplementInfo, { color: colors.text }]}>
          Dosage: <Text style={{ fontWeight: 'bold' }}>{item.dosage}</Text>
        </Text>
        <Text style={[styles.supplementInfo, { color: colors.text }]}>
          Frequency: <Text style={{ fontWeight: 'bold' }}>{item.frequency}</Text>
        </Text>
        
        {item.request_reason === 'interaction' && item.interaction_info && (
          <View style={[styles.interactionDetails, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
            <Text style={[styles.interactionTitle, { color: colors.warning }]}>
              ⚠️ Potential Interactions:
            </Text>
            {(Array.isArray(item.interaction_info) ? item.interaction_info : []).map((interaction: any, index: number) => (
              <Text key={index} style={[styles.interactionItem, { color: colors.text }]}>
                • Interacts with <Text style={{ fontWeight: 'bold' }}>{interaction.interactingWith}</Text>
                {interaction.severity && (
                  <Text style={{ color: interaction.severity === 'strong' ? colors.danger : colors.warning }}>
                    {' '}({interaction.severity} interaction)
                  </Text>
                )}
              </Text>
            ))}
          </View>
        )}

        {item.notes && (
          <Text style={[styles.patientNotes, { color: colors.tabIconDefault }]}>
            Patient note: "{item.notes}"
          </Text>
        )}
      </View>

      <View style={styles.approvalActions}>
        <Pressable
          style={[styles.rejectButton, { backgroundColor: colors.danger }]}
          onPress={() => {
            setSelectedRequestId(item.id);
            setResponseType('rejected');
            setDoctorNotes('');
            setShowResponseModal(true);
          }}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </Pressable>
        <Pressable
          style={[styles.approveButton, { backgroundColor: colors.success || colors.primary }]}
          onPress={() => {
            setSelectedRequestId(item.id);
            setResponseType('approved');
            setDoctorNotes('');
            setShowResponseModal(true);
          }}
        >
          <Text style={styles.buttonText}>Approve</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderIncomingRequest = ({ item }: { item: Request }) => (
    <View style={[styles.requestCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.requestHeader}>
        <Text style={[styles.requestTitle, { color: colors.text }]}>
          {item.requester_name}
        </Text>
        <Text style={[styles.requestType, { color: colors.tabIconDefault }]}>
          Patient Request
        </Text>
      </View>
      <Text style={[styles.requestEmail, { color: colors.tabIconDefault }]}>
        {item.requester_email}
      </Text>
      <Text style={[styles.requestDate, { color: colors.tabIconDefault }]}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
      <View style={styles.requestActions}>
        <Pressable
          style={[styles.acceptButton, { backgroundColor: colors.primary }]}
          onPress={() => handleRespondToRequest(item.id, 'accepted')}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </Pressable>
        <Pressable
          style={[styles.rejectButton, { backgroundColor: colors.danger }]}
          onPress={() => handleRespondToRequest(item.id, 'rejected')}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderOutgoingRequest = ({ item }: { item: Request }) => (
    <View style={[styles.requestCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.requestHeader}>
        <Text style={[styles.requestTitle, { color: colors.text }]}>
          {item.recipient_name}
        </Text>
        <Text style={[styles.requestStatus, {
          color: item.status === 'pending' ? colors.warning :
            item.status === 'accepted' ? colors.success : colors.danger
        }]}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
      <Text style={[styles.requestEmail, { color: colors.tabIconDefault }]}>
        {item.recipient_email}
      </Text>
      <Text style={[styles.requestDate, { color: colors.tabIconDefault }]}>
        Sent: {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  const renderPatient = ({ item }: { item: Patient }) => (
    <Pressable onPress={() => handleViewPatient(item)}>
      <View style={[
        styles.requestCard, 
        { 
          backgroundColor: item.is_primary_doctor ? colors.primary + '20' : colors.cardBackground, 
          borderColor: item.is_primary_doctor ? colors.primary : colors.border,
          borderWidth: item.is_primary_doctor ? 2 : 1
        }
      ]}>
        <View style={styles.requestHeader}>
          <Text style={[styles.requestTitle, { color: colors.text }]}>
            {item.full_name}
          </Text>
          <View style={styles.actionContainer}>
            {item.is_primary_doctor && (
              <Text style={[styles.primaryIndicatorText, { color: colors.primary }]}>
                You are Primary
              </Text>
            )}
            <Pressable
              style={[styles.removeButton, { backgroundColor: colors.danger }]}
              onPress={() => handleRemovePatient(item.id)}
            >
              <Text style={styles.buttonText}>Remove</Text>
            </Pressable>
          </View>
        </View>
        <Text style={[styles.requestEmail, { color: colors.tabIconDefault }]}>
          {item.email}
        </Text>
        <Text style={[styles.requestDate, { color: colors.tabIconDefault }]}>
          Connected: {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <Text style={[styles.tapToView, { color: colors.primary }]}>
          Tap to view supplements
        </Text>
      </View>
    </Pressable>
  );

  if (!user || user.userType !== 'doctor') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.appName, { color: colors.primary }]}>
            {Config.APP_NAME}
          </ThemedText>
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
        <ThemedText type="title" style={[styles.appName, { color: colors.primary }]}>
          {Config.APP_NAME}
        </ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Approval Requests Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Supplement Approval Requests
          </Text>
          {approvalRequests.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              No pending approval requests
            </Text>
          ) : (
            <FlatList
              data={approvalRequests}
              renderItem={renderApprovalRequest}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>


        {/* My Patients Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              My Patients
            </Text>
            <Pressable
              style={[styles.sendRequestButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowSendRequestModal(true)}
            >
              <Text style={styles.buttonText}>Add Patient</Text>
            </Pressable>
          </View>
          {myPatients.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              No patients connected
            </Text>
          ) : (
            <FlatList
              data={myPatients}
              renderItem={renderPatient}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Incoming Requests Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Incoming Requests
          </Text>
          {incomingRequests.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              No incoming requests
            </Text>
          ) : (
            <FlatList
              data={incomingRequests}
              renderItem={renderIncomingRequest}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Pending Requests Section */}
        {outgoingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Pending Requests
            </Text>
            <FlatList
              data={outgoingRequests}
              renderItem={renderOutgoingRequest}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>

      {/* Send Request Modal */}
      <Modal
        visible={showSendRequestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSendRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Send Request to Patient
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.tabIconDefault }]}>
              Enter the patient's user ID
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Patient ID (e.g., 123)"
              placeholderTextColor={colors.tabIconDefault}
              value={patientId}
              onChangeText={setPatientId}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.tabIconDefault }]}
                onPress={() => setShowSendRequestModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.sendButton, {
                  backgroundColor: colors.primary,
                  opacity: loading ? 0.5 : 1
                }]}
                onPress={handleSendRequest}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Sending...' : 'Send Request'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {responseType === 'approved' ? 'Approve' : 'Reject'} Request
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.tabIconDefault }]}>
              {responseType === 'approved' ? 'Supplement' : 'Request'} ID: {selectedRequestId}
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Optional notes for the patient"
              placeholderTextColor={colors.tabIconDefault}
              value={doctorNotes}
              onChangeText={setDoctorNotes}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.tabIconDefault }]}
                onPress={() => {
                  setShowResponseModal(false);
                  setDoctorNotes('');
                  setSelectedRequestId(null);
                  setResponseType(null);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.sendButton, {
                  backgroundColor: responseType === 'approved' ? colors.success : colors.danger,
                  opacity: loading ? 0.5 : 1
                }]}
                onPress={async () => {
                  if (selectedRequestId !== null && responseType) {
                    setLoading(true);
                    try {
                      // Call the approval response handler directly
                      await handleApprovalResponse(selectedRequestId, responseType, doctorNotes);
                      setShowResponseModal(false);
                    } catch (error) {
                      console.error('Error handling approval response:', error);
                      platformAlert('Error', 'Failed to process request');
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Processing...' : responseType === 'approved' ? 'Approve' : 'Reject'}
                </Text>
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
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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
  requestCard: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  notificationCard: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  requestType: {
    fontSize: 12,
    fontWeight: '500',
  },
  requestStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestEmail: {
    fontSize: 14,
    marginBottom: 5,
  },
  requestDate: {
    fontSize: 12,
    marginBottom: 10,
  },
  tapToView: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    flex: 1,
  },
  rejectButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    flex: 1,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  sendRequestButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {},
  sendButton: {},
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  notificationTitleContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationDate: {
    fontSize: 12,
  },
  dismissButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  dismissButtonText: {
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 14,
  },
  notificationContent: {
    marginTop: 10,
  },
  patientInfo: {
    fontSize: 14,
  },
  supplementInfo: {
    fontSize: 14,
    marginTop: 4,
  },
  interactionDescription: {
    fontSize: 12,
    marginTop: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  approvalCard: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  approvalTitleContainer: {
    flex: 1,
  },
  approvalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  approvalDate: {
    fontSize: 12,
  },
  approvalContent: {
    marginTop: 10,
  },
  interactionDetails: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  interactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  interactionItem: {
    fontSize: 12,
    marginLeft: 5,
  },
  patientNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  approveButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    flex: 1,
  },
});