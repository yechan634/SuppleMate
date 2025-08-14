import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { useColorScheme } from '@/hooks/useColorScheme';
import { socketService } from '@/services/socketService';
import { platformAlert, platformConfirm } from '@/utils/platformAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface Doctor {
  id: number;
  doctor_id: number;
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

interface DoctorSearchResult {
  id: number;
  full_name: string;
  clinic_name: string;
  biography?: string;
}

export default function HealthScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [user, setUser] = useState<User | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<Request[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Request[]>([]);
  const [myDoctors, setMyDoctors] = useState<Doctor[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSendRequestModal, setShowSendRequestModal] = useState(false);
  const [showPrimaryDoctorModal, setShowPrimaryDoctorModal] = useState(false);
  const [showDoctorInfoModal, setShowDoctorInfoModal] = useState(false);
  const [selectedDoctorInfo, setSelectedDoctorInfo] = useState<DoctorSearchResult | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [searchResults, setSearchResults] = useState<DoctorSearchResult[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSearchResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const getCurrentUser = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('Health page - User data:', parsedUser);
        console.log('Health page - User type:', parsedUser.userType);
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

    const handleMyDoctorsUpdate = () => {
      console.log('Real-time: My doctors updated');
      fetchData();
    };

    const handleDoctorResponseNotification = (data: any) => {
      console.log('Real-time: Doctor response notification received', data);
      fetchData();
      // Show immediate notification to user
      const responseType = data.response_type === 'approved' ? 'approved' : 'rejected';
      const message = data.doctor_notes 
        ? `Dr. ${data.doctor_name} ${responseType} your ${data.supplement_name} request. Notes: ${data.doctor_notes}`
        : `Dr. ${data.doctor_name} ${responseType} your ${data.supplement_name} request.`;
      
      platformAlert(
        `Request ${responseType.charAt(0).toUpperCase() + responseType.slice(1)}`,
        message
      );
    };

    // Register event listeners
    socketService.onIncomingRequestsUpdated(handleIncomingRequestsUpdate);
    socketService.onOutgoingRequestsUpdated(handleOutgoingRequestsUpdate);
    socketService.onMyDoctorsUpdated(handleMyDoctorsUpdate);
    socketService.onDoctorResponseNotification(handleDoctorResponseNotification);

    // Cleanup function
    return () => {
      socketService.offIncomingRequestsUpdated(handleIncomingRequestsUpdate);
      socketService.offOutgoingRequestsUpdated(handleOutgoingRequestsUpdate);
      socketService.offMyDoctorsUpdated(handleMyDoctorsUpdate);
      socketService.offDoctorResponseNotification(handleDoctorResponseNotification);
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

      // Fetch my doctors
      const doctorsResponse = await fetch(`${Config.API_URL}/api/doctor-patient/doctors/${currentUser.id}`);
      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        setMyDoctors(doctorsData);
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
    if (!selectedDoctor || !user) {
      platformAlert('Error', 'Please select a doctor from the list');
      return;
    }

    setLoading(true);
    try {
      // Send the request using the selected doctor's ID
      const response = await fetch(`${Config.API_URL}/api/doctor-patient/send-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterId: user.id,
          recipientId: selectedDoctor.id,
          requestType: 'patient_to_doctor'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        platformAlert('Success', 'Request sent successfully');
        resetModalState();
        fetchData();
      } else {
        // Provide more helpful error messages
        let errorMessage = result.error || 'Failed to send request';

        if (result.error === 'Relationship already exists') {
          errorMessage = 'You are already connected to this doctor. Check your "My Doctors" section.';
        } else if (result.error === 'Pending request already exists') {
          errorMessage = 'You already have a pending request to this doctor. Please wait for their response.';
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

  const handleRemoveDoctor = async (relationshipId: number) => {
    platformConfirm(
      'Remove Doctor',
      'Are you sure you want to remove this doctor?',
      async () => {
        try {
          const response = await fetch(`${Config.API_URL}/api/doctor-patient/relationship/${relationshipId}`, {
            method: 'DELETE',
          });

          const result = await response.json();

          if (response.ok) {
            platformAlert('Success', 'Doctor removed successfully');
            fetchData();
          } else {
            platformAlert('Error', result.error || 'Failed to remove doctor');
          }
        } catch (error) {
          console.error('Error removing doctor:', error);
          platformAlert('Error', 'Failed to remove doctor');
        }
      }
    );
  };

  const handleSetPrimaryDoctor = async (doctorId: number) => {
    if (!user) return;

    try {
      const response = await fetch(`${Config.API_URL}/api/doctor-patient/set-primary-doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: user.id,
          doctorId: doctorId
        }),
      });

      const result = await response.json();

      if (response.ok) {
        platformAlert('Success', 'Primary doctor set successfully');
        setShowPrimaryDoctorModal(false);
        fetchData();
      } else {
        platformAlert('Error', result.error || 'Failed to set primary doctor');
      }
    } catch (error) {
      console.error('Error setting primary doctor:', error);
      platformAlert('Error', 'Failed to set primary doctor');
    }
  };

  const handleRemovePrimaryDoctor = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${Config.API_URL}/api/doctor-patient/remove-primary-doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: user.id
        }),
      });

      const result = await response.json();

      if (response.ok) {
        platformAlert('Success', 'Primary doctor removed successfully');
        setShowPrimaryDoctorModal(false);
        fetchData();
      } else {
        platformAlert('Error', result.error || 'Failed to remove primary doctor');
      }
    } catch (error) {
      console.error('Error removing primary doctor:', error);
      platformAlert('Error', 'Failed to remove primary doctor');
    }
  };

  const searchDoctors = useCallback(async (searchTerm: string) => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const response = await fetch(`${Config.API_URL}/api/doctors/search?query=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      }
    } catch (error) {
      console.error('Error searching doctors:', error);
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, []);

  const handleDoctorSearchChange = (text: string) => {
    setDoctorSearch(text);
    setSelectedDoctor(null);
    searchDoctors(text);
  };

  const selectDoctor = (doctor: DoctorSearchResult) => {
    setSelectedDoctor(doctor);
    setDoctorSearch(doctor.full_name);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const showDoctorInfo = (doctor: DoctorSearchResult) => {
    setSelectedDoctorInfo(doctor);
    setShowDoctorInfoModal(true);
  };

  const fetchDoctorInfo = async (doctorId: number) => {
    try {
      const response = await fetch(`${Config.API_URL}/api/doctors/${doctorId}`);
      if (response.ok) {
        const doctorData = await response.json();
        setSelectedDoctorInfo(doctorData);
        setShowDoctorInfoModal(true);
      } else {
        platformAlert('Error', 'Failed to fetch doctor information');
      }
    } catch (error) {
      console.error('Error fetching doctor info:', error);
      platformAlert('Error', 'Failed to fetch doctor information');
    }
  };

  const renderIncomingRequest = ({ item }: { item: Request }) => (
    <View style={[styles.requestCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.requestHeader}>
        <Text style={[styles.requestTitle, { color: colors.text }]}>
          Dr. {item.requester_name}
        </Text>
        <Text style={[styles.requestType, { color: colors.tabIconDefault }]}>
          Doctor Request
        </Text>
      </View>
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
    <Pressable
      style={[styles.requestCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={() => fetchDoctorInfo(item.recipient_id)}
    >
      <View style={styles.requestHeader}>
        <Text style={[styles.requestTitle, { color: colors.text }]}>
          Dr. {item.recipient_name}
        </Text>
        <Text style={[styles.requestStatus, {
          color: item.status === 'pending' ? colors.warning :
            item.status === 'accepted' ? colors.success : colors.danger
        }]}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
      <Text style={[styles.requestDate, { color: colors.tabIconDefault }]}>
        Sent: {new Date(item.created_at).toLocaleDateString()}
      </Text>
      <Text style={[styles.tapToViewText, { color: colors.primary }]}>
        Tap to view doctor info
      </Text>
    </Pressable>
  );

  const renderDoctor = ({ item }: { item: Doctor }) => (
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
          Dr. {item.full_name}
        </Text>
        <View style={styles.actionContainer}>
          {item.is_primary_doctor && (
            <Text style={[styles.primaryIndicatorText, { color: colors.primary }]}>
              Primary Doctor
            </Text>
          )}
          <Pressable
            style={[styles.removeButton, { backgroundColor: colors.danger }]}
            onPress={() => handleRemoveDoctor(item.id)}
          >
            <Text style={styles.buttonText}>Remove</Text>
          </Pressable>
        </View>
      </View>
      <Text style={[styles.requestDate, { color: colors.tabIconDefault }]}>
        Connected: {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  const resetModalState = () => {
    setDoctorSearch('');
    setSelectedDoctor(null);
    setSearchResults([]);
    setShowDropdown(false);
    setShowSendRequestModal(false);
    setShowDoctorInfoModal(false);
    setSelectedDoctorInfo(null);
  };

  if (!user || user.userType !== 'supplement_user') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.appName, { color: colors.primary }]}>
            {Config.APP_NAME}
          </ThemedText>
        </View>
        <View style={styles.content}>
          <ThemedText style={[styles.errorText, { color: colors.text }]}>
            This page is only available for supplement users.
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

        {/* My Doctors Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              My Doctors
            </Text>
            {myDoctors.length > 0 && (
              <Pressable
                style={[styles.primaryDoctorButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowPrimaryDoctorModal(true)}
              >
                <Text style={styles.buttonText}>Set Primary</Text>
              </Pressable>
            )}
          </View>

          {/* Add Doctor Button with Dashed Style */}
          <Pressable
            style={[styles.addDoctorButton, { borderColor: colors.border }]}
            onPress={() => setShowSendRequestModal(true)}
          >
            <Text style={[styles.addDoctorText, { color: colors.primary }]}>
              + Send Request to Doctor
            </Text>
          </Pressable>

          {myDoctors.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
              No doctors connected
            </Text>
          ) : (
            <FlatList
              data={myDoctors.sort((a, b) => (b.is_primary_doctor ? 1 : 0) - (a.is_primary_doctor ? 1 : 0))}
              renderItem={renderDoctor}
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
        onRequestClose={resetModalState}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Send Request to Doctor
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.tabIconDefault }]}>
              Search for a doctor by name
            </Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                placeholder="Start typing doctor's name..."
                placeholderTextColor={colors.tabIconDefault}
                value={doctorSearch}
                onChangeText={handleDoctorSearchChange}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowDropdown(true);
                  }
                }}
              />
              {showDropdown && searchResults.length > 0 && (
                <View style={[styles.dropdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <Pressable
                        style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                        onPress={() => selectDoctor(item)}
                      >
                        <Text style={[styles.dropdownText, { color: colors.text }]}>
                          Dr. {item.full_name}
                        </Text>
                        <Text style={[styles.dropdownSubtext, { color: colors.tabIconDefault }]}>
                          {item.clinic_name}
                        </Text>
                      </Pressable>
                    )}
                    style={styles.dropdownList}
                    nestedScrollEnabled={true}
                  />
                </View>
              )}
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.tabIconDefault }]}
                onPress={resetModalState}
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

      {/* Primary Doctor Selection Modal */}
      <Modal
        visible={showPrimaryDoctorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPrimaryDoctorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Primary Doctor
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.tabIconDefault }]}>
              Only your primary doctor will receive interaction notifications
            </Text>

            <ScrollView style={styles.doctorList}>
              {/* None Option */}
              <Pressable
                style={[styles.doctorOption, { borderColor: colors.border }]}
                onPress={handleRemovePrimaryDoctor}
              >
                <Text style={[styles.doctorOptionText, { color: colors.text }]}>
                  None (No primary doctor)
                </Text>
                {myDoctors.every(doctor => !doctor.is_primary_doctor) && (
                  <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )}
              </Pressable>

              {/* Doctor Options */}
              {myDoctors.map((doctor) => (
                <Pressable
                  key={doctor.id}
                  style={[styles.doctorOption, { borderColor: colors.border }]}
                  onPress={() => handleSetPrimaryDoctor(doctor.doctor_id)}
                >
                  <View>
                    <Text style={[styles.doctorOptionText, { color: colors.text }]}>
                      Dr. {doctor.full_name}
                    </Text>
                  </View>
                  {doctor.is_primary_doctor && (
                    <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                      <Text style={styles.selectedText}>✓</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tabIconDefault }]}
                onPress={() => setShowPrimaryDoctorModal(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Doctor Info Modal */}
      <Modal
        visible={showDoctorInfoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDoctorInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            {selectedDoctorInfo && (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Dr. {selectedDoctorInfo.full_name}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.tabIconDefault }]}>
                  {selectedDoctorInfo.clinic_name}
                </Text>

                <ScrollView style={styles.biographySection}>
                  <Text style={[styles.biographyLabel, { color: colors.text }]}>
                    About
                  </Text>
                  <Text style={[styles.biographyText, { color: colors.tabIconDefault }]}>
                    {selectedDoctorInfo.biography || 'No biography available.'}
                  </Text>
                </ScrollView>

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.modalButton, { backgroundColor: colors.tabIconDefault }]}
                    onPress={() => setShowDoctorInfoModal(false)}
                  >
                    <Text style={styles.buttonText}>Close</Text>
                  </Pressable>
                </View>
              </>
            )}
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
  addDoctorButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  addDoctorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryDoctorButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    height: 'auto',
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
  searchContainer: {
    position: 'relative',
    marginBottom: 60,
    flex: 1,
    minHeight: 250,
  },
  dropdown: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 4,
  },
  dropdownList: {
    maxHeight: 250,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  dropdownSubtext: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 'auto',
    paddingTop: 20,
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
  doctorList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  doctorOption: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  biographySection: {
    maxHeight: 200,
    marginVertical: 20,
  },
  biographyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  biographyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tapToViewText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 5,
  },
});
