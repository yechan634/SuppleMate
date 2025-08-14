import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert function that works on both native and web
 * On native: Uses React Native Alert.alert
 * On web: Uses window.alert or console.log for testing
 */
export const platformAlert = (title: string, message?: string, buttons?: any[]) => {
    if (Platform.OS === 'web') {
        // For web compatibility - use window.alert or console for testing
        if (typeof window !== 'undefined' && window.alert) {
            const alertText = message ? `${title}\n\n${message}` : title;
            window.alert(alertText);
        } else {
            // Fallback for testing environments without window.alert
            console.warn(`Alert: ${title}${message ? ` - ${message}` : ''}`);
        }
    } else {
        // Native React Native Alert
        Alert.alert(title, message, buttons);
    }
};

/**
 * Cross-platform confirmation dialog
 * On native: Uses React Native Alert.alert with buttons
 * On web: Uses window.confirm
 */
export const platformConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
) => {
    if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm) {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            if (confirmed) {
                onConfirm();
            } else if (onCancel) {
                onCancel();
            }
        } else {
            // Fallback for testing - just log and execute confirm action
            console.warn(`Confirm: ${title} - ${message}`);
            onConfirm();
        }
    } else {
        Alert.alert(title, message, [
            { text: 'Cancel', style: 'cancel', onPress: onCancel },
            { text: 'OK', onPress: onConfirm }
        ]);
    }
};
