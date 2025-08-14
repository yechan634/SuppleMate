import { Config } from '@/constants/Config';
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private userId: number | null = null;

  connect(userId: number) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.userId = userId;
    this.socket = io(Config.API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      // Join the user's room for targeted notifications
      this.socket?.emit('join', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  // Event listeners for real-time updates
  onIncomingRequestsUpdated(callback: () => void) {
    this.socket?.on('incomingRequestsUpdated', callback);
  }

  onOutgoingRequestsUpdated(callback: () => void) {
    this.socket?.on('outgoingRequestsUpdated', callback);
  }

  onMyPatientsUpdated(callback: () => void) {
    this.socket?.on('myPatientsUpdated', callback);
  }

  onMyDoctorsUpdated(callback: () => void) {
    this.socket?.on('myDoctorsUpdated', callback);
  }

  onApprovalRequestsUpdated(callback: () => void) {
    this.socket?.on('approvalRequestsUpdated', callback);
  }

  onPendingRequestsUpdated(callback: () => void) {
    this.socket?.on('pendingRequestsUpdated', callback);
  }

  onSupplementsUpdated(callback: () => void) {
    this.socket?.on('supplementsUpdated', callback);
  }

  onInteractionNotification(callback: (data: any) => void) {
    this.socket?.on('interactionNotification', callback);
  }

  onDoctorResponseNotification(callback: (data: any) => void) {
    this.socket?.on('doctorResponseNotification', callback);
  }

  onPatientSupplementsUpdated(callback: (data: any) => void) {
    console.log('Registering patientSupplementsUpdated listener');
    this.socket?.on('patientSupplementsUpdated', callback);
  }

  // Remove event listeners
  offIncomingRequestsUpdated(callback?: () => void) {
    this.socket?.off('incomingRequestsUpdated', callback);
  }

  offOutgoingRequestsUpdated(callback?: () => void) {
    this.socket?.off('outgoingRequestsUpdated', callback);
  }

  offMyPatientsUpdated(callback?: () => void) {
    this.socket?.off('myPatientsUpdated', callback);
  }

  offMyDoctorsUpdated(callback?: () => void) {
    this.socket?.off('myDoctorsUpdated', callback);
  }

  offApprovalRequestsUpdated(callback?: () => void) {
    this.socket?.off('approvalRequestsUpdated', callback);
  }

  offPendingRequestsUpdated(callback?: () => void) {
    this.socket?.off('pendingRequestsUpdated', callback);
  }

  offSupplementsUpdated(callback?: () => void) {
    this.socket?.off('supplementsUpdated', callback);
  }

  offInteractionNotification(callback?: (data: any) => void) {
    this.socket?.off('interactionNotification', callback);
  }

  offDoctorResponseNotification(callback?: (data: any) => void) {
    this.socket?.off('doctorResponseNotification', callback);
  }

  offPatientSupplementsUpdated(callback?: (data: any) => void) {
    console.log('Removing patientSupplementsUpdated listener');
    this.socket?.off('patientSupplementsUpdated', callback);
  }
}

// Export a singleton instance
export const socketService = new SocketService();
