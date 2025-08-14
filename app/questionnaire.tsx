import { ThemedText } from '@/components/ThemedText';
import { Config } from '@/constants/Config';
import { useThemeColor } from '@/hooks/useThemeColor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

function handleAlert(error: string, msg: string) {
    if (Platform.OS === 'web') {
        window.alert(`${error}\n\n${msg}`);
    } else {
        Alert.alert(error, msg);
    }
}

function handleSuccessAlert(title: string, message: string, buttonText: string, onPress: () => void): void {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
        onPress();
    } else {
        Alert.alert(
            title,
            message,
            [
                {
                    text: buttonText,
                    onPress: onPress,
                }
            ]
        );
    }
}

export default function QuestionnaireScreen() {
    // Get search params to determine if this is an update mode
    const params = useLocalSearchParams();
    const isUpdateMode = params.update === 'true';
    const prefilledDateOfBirth = params.dateOfBirth as string || '';
    const prefilledWeight = params.weight as string || '';
    const prefilledGender = params.gender as string || '';
    const prefilledAlcohol = params.alcohol as string || '';
    const prefilledSmoking = params.smoking as string || '';
    const prefilledHeight = params.height as string || '';

    const [dateOfBirth, setDateOfBirth] = useState(prefilledDateOfBirth);
    const [weight, setWeight] = useState(prefilledWeight);
    const [gender, setGender] = useState(prefilledGender);
    const [alcohol, setAlcohol] = useState(prefilledAlcohol);
    const [smoking, setSmoking] = useState(prefilledSmoking);
    const [height, setHeight] = useState(prefilledHeight);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const primaryColor = useThemeColor({}, 'primary');
    const borderColor = useThemeColor({}, 'border');
    const cardBackground = useThemeColor({}, 'cardBackground');
    const iconColor = useThemeColor({}, 'icon');

    const handleComplete = async () => {
        if (!dateOfBirth || !weight || !height || !gender || !alcohol || !smoking) {
            handleAlert('Error', 'Please fill in all fields');
            return;
        }

        const dobDate = new Date(dateOfBirth);
        const weightNum = parseFloat(weight);
        const heightNum = parseFloat(height);

        // Validate date of birth
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 150, today.getMonth(), today.getDate());
        const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());

        if (isNaN(dobDate.getTime()) || dobDate < minDate || dobDate > maxDate) {
            handleAlert('Error', 'Please enter a valid date of birth (must be between 13 and 150 years old)');
            return;
        }

        if (isNaN(weightNum) || weightNum < 20 || weightNum > 500) {
            handleAlert('Error', 'Please enter a valid weight in kg (20-500)');
            return;
        }

        if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
            handleAlert('Error', 'Please enter a valid height in cm (50-300)');
            return;
        }

        setIsLoading(true);

        try {
            // Get the current user data from AsyncStorage
            const userData = await AsyncStorage.getItem('user');
            if (!userData) {
                throw new Error('User data not found');
            }

            const user = JSON.parse(userData);

            // Update user profile with health data
            const response = await fetch(`${Config.API_URL}/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    dateOfBirth: dateOfBirth,
                    weight: weightNum,
                    height: heightNum,
                    gender: gender,
                    alcohol: alcohol,
                    smoking: smoking,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }

            // Update user data in AsyncStorage
            const updatedUser = {
                ...user,
                dateOfBirth: dateOfBirth,
                weight: weightNum,
                height: heightNum,
                gender: gender,
                alcohol: alcohol,
                smoking: smoking
            };
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

            if (isUpdateMode) {
                // If in update mode, show success and go back to profile
                handleSuccessAlert(
                    'Profile Updated',
                    'Your profile information has been updated successfully.',
                    'Back to Profile',
                    () => router.back()
                );
            } else {
                // If in signup mode, navigate to main app
                handleSuccessAlert(
                    'Account Created Successfully',
                    'Welcome to SuppleMate! You can now access all features.',
                    'Get Started',
                    () => router.replace('/(tabs)')
                );
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Profile update failed';
            handleAlert('Update Failed', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <StatusBar style="auto" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.headerContainer}>
                        <ThemedText type="title" style={[styles.title, { color: primaryColor }]}>
                            {isUpdateMode ? 'Update Your Profile' : 'Complete Your Profile'}
                        </ThemedText>
                        <ThemedText style={styles.subtitle}>
                            {isUpdateMode ? 'Update your health information' : 'Help us personalize your supplement experience'}
                        </ThemedText>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <ThemedText style={[styles.label, { color: textColor }]}>
                                Date of Birth
                            </ThemedText>
                            <View style={[styles.inputWrapper, { borderColor: borderColor, backgroundColor: cardBackground }]}>
                                <ThemedText style={styles.inputIcon}>🎂</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={iconColor}
                                    value={dateOfBirth}
                                    onChangeText={setDateOfBirth}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <ThemedText style={[styles.label, { color: textColor }]}>
                                Weight
                            </ThemedText>
                            <View style={[styles.inputWrapper, { borderColor: borderColor, backgroundColor: cardBackground }]}>
                                <ThemedText style={styles.inputIcon}>⚖️</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="70"
                                    placeholderTextColor={iconColor}
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="decimal-pad"
                                />
                                <ThemedText style={styles.unit}>kg</ThemedText>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <ThemedText style={[styles.label, { color: textColor }]}>
                                Gender
                            </ThemedText>
                            <View style={[styles.inputWrapper, { borderColor: '#E5E5E5' }]}>
                                <ThemedText style={styles.inputIcon}>👤</ThemedText>
                                <View style={styles.selectContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.selectButton, 
                                            { backgroundColor: gender === 'male' ? primaryColor : cardBackground },
                                            gender === 'male' && styles.selectedButton
                                        ]}
                                        onPress={() => setGender('male')}
                                    >
                                        <ThemedText style={[
                                            styles.selectText, 
                                            { color: gender === 'male' ? '#FFFFFF' : iconColor },
                                            gender === 'male' && styles.selectedText
                                        ]}>Male</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.selectButton, 
                                            { backgroundColor: gender === 'female' ? primaryColor : cardBackground },
                                            gender === 'female' && styles.selectedButton
                                        ]}
                                        onPress={() => setGender('female')}
                                    >
                                        <ThemedText style={[
                                            styles.selectText, 
                                            { color: gender === 'female' ? '#FFFFFF' : iconColor },
                                            gender === 'female' && styles.selectedText
                                        ]}>Female</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.selectButton, 
                                            { backgroundColor: gender === 'other' ? primaryColor : cardBackground },
                                            gender === 'other' && styles.selectedButton
                                        ]}
                                        onPress={() => setGender('other')}
                                    >
                                        <ThemedText style={[
                                            styles.selectText, 
                                            { color: gender === 'other' ? '#FFFFFF' : iconColor },
                                            gender === 'other' && styles.selectedText
                                        ]}>Other</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <ThemedText style={[styles.label, { color: textColor }]}>
                                Alcohol Usage
                            </ThemedText>
                            <View style={[styles.inputWrapper, { borderColor: '#E5E5E5' }]}>
                                <ThemedText style={styles.inputIcon}>🍷</ThemedText>
                                <View style={styles.selectContainer}>
                                    <TouchableOpacity
                                        style={[styles.selectButton, alcohol === 'none' && styles.selectedButton]}
                                        onPress={() => setAlcohol('none')}
                                    >
                                        <ThemedText style={[styles.selectText, alcohol === 'none' && styles.selectedText]}>None</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.selectButton, alcohol === 'occasional' && styles.selectedButton]}
                                        onPress={() => setAlcohol('occasional')}
                                    >
                                        <ThemedText style={[styles.selectText, alcohol === 'occasional' && styles.selectedText]}>Occasional</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.selectButton, alcohol === 'regular' && styles.selectedButton]}
                                        onPress={() => setAlcohol('regular')}
                                    >
                                        <ThemedText style={[styles.selectText, alcohol === 'regular' && styles.selectedText]}>Regular</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <ThemedText style={[styles.label, { color: textColor }]}>
                                Smoking Usage
                            </ThemedText>
                            <View style={[styles.inputWrapper, { borderColor: '#E5E5E5' }]}>
                                <ThemedText style={styles.inputIcon}>🚭</ThemedText>
                                <View style={styles.selectContainer}>
                                    <TouchableOpacity
                                        style={[styles.selectButton, smoking === 'none' && styles.selectedButton]}
                                        onPress={() => setSmoking('none')}
                                    >
                                        <ThemedText style={[styles.selectText, smoking === 'none' && styles.selectedText]}>None</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.selectButton, smoking === 'occasional' && styles.selectedButton]}
                                        onPress={() => setSmoking('occasional')}
                                    >
                                        <ThemedText style={[styles.selectText, smoking === 'occasional' && styles.selectedText]}>Occasional</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.selectButton, smoking === 'regular' && styles.selectedButton]}
                                        onPress={() => setSmoking('regular')}
                                    >
                                        <ThemedText style={[styles.selectText, smoking === 'regular' && styles.selectedText]}>Regular</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <ThemedText style={[styles.label, { color: textColor }]}>
                                Height
                            </ThemedText>
                            <View style={[styles.inputWrapper, { borderColor: '#E5E5E5' }]}>
                                <ThemedText style={styles.inputIcon}>📏</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="175"
                                    placeholderTextColor="#999"
                                    value={height}
                                    onChangeText={setHeight}
                                    keyboardType="decimal-pad"
                                />
                                <ThemedText style={styles.unit}>cm</ThemedText>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.completeButton, { backgroundColor: primaryColor }]}
                            onPress={handleComplete}
                            disabled={isLoading}
                        >
                            <ThemedText style={styles.completeButtonText}>
                                {isLoading
                                    ? (isUpdateMode ? 'UPDATING...' : 'CREATING ACCOUNT...')
                                    : (isUpdateMode ? 'UPDATE PROFILE' : 'SIGN UP')
                                }
                            </ThemedText>
                        </TouchableOpacity>

                        {isUpdateMode && (
                            <TouchableOpacity
                                style={[styles.cancelButton, { borderColor: primaryColor }]}
                                onPress={() => router.back()}
                                disabled={isLoading}
                            >
                                <ThemedText style={[styles.cancelButtonText, { color: primaryColor }]}>
                                    CANCEL
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 16, // reduce from 32 for safer edge
        paddingVertical: 16,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 32,
        fontWeight: '300',
        letterSpacing: 1,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    inputIcon: {
        fontSize: 16,
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '400',
    },
    unit: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    completeButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    cancelButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 12,
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    selectButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 4,
        borderRadius: 8,
        alignItems: 'center',
    },
    selectedButton: {
    },
    selectText: {
        fontSize: 12,
        fontWeight: '500',
    },
    selectedText: {
        fontWeight: '600',
    },
    selectContainer: {
        flex: 1,
        flexDirection: 'row',
        marginLeft: 8,
    },
});
