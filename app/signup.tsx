import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { platformAlert } from '@/utils/platformAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Image,
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
    platformAlert(error, msg);
}

function handleSuccessAlert(title: string, message: string, buttonText: string, onPress: () => void): void {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
        onPress();
    } else {
        platformAlert(title, message, [
            {
                text: buttonText,
                onPress: onPress,
            }
        ]);
    }
}



export default function SignupScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [clinicName, setClinicName] = useState('');
    const [biography, setBiography] = useState('');
    const [userType, setUserType] = useState<'supplement_user' | 'doctor'>('supplement_user');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const primaryColor = useThemeColor({}, 'primary');

    const handleSignup = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            console.log("Validation failed - showing alert");
            handleAlert('Error', 'Please fill in all fields');
            return;
        }

        if (userType === 'doctor' && (!clinicName || !biography)) {
            handleAlert('Error', 'Please enter your clinic name and biography');
            return;
        }

        if (password !== confirmPassword) {
            handleAlert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            handleAlert('Error', 'Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);

        try {
            const requestBody: any = {
                fullName: fullName.trim(),
                email: email.trim(),
                password: password,
                userType: userType,
            };

            // Add clinic name and biography only for doctors
            if (userType === 'doctor') {
                requestBody.clinicName = clinicName.trim();
                requestBody.biography = biography.trim();
            }

            const response = await fetch(`${Config.API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            // Store user data in AsyncStorage
            await AsyncStorage.setItem('user', JSON.stringify(data.user));

            // Conditional navigation based on user type
            if (userType === 'doctor') {
                // Doctors skip questionnaire and go to patients tab
                handleSuccessAlert(
                    'Account Created',
                    `Welcome to SuppleMate, Dr. ${data.user.fullName}! Your account has been created successfully.`,
                    'Get Started',
                    () => router.replace('/(tabs)/patients')
                );
            } else {
                // Supplement users go to questionnaire
                handleSuccessAlert(
                    'Account Created',
                    `Welcome to SuppleMate! Please complete your profile to get started.`,
                    'Continue',
                    () => router.replace('/questionnaire')
                );
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Signup failed';
            handleAlert('Signup Failed', message);
        } finally {
            setIsLoading(false);
        }
    };

    const navigateToLogin = () => {
        router.push('/login');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <StatusBar style="auto" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/images/logo.png')}
                            style={{ width: 200, height: 150, resizeMode: 'contain', marginBottom: 8 }}
                            accessibilityLabel="SuppleMate Logo"
                        />
                        <ThemedText style={[styles.subtitle, { color: colors.icon }]}> 
                            Create an account
                        </ThemedText>
                    </View>

                    <View style={styles.formContainer}>
                        {/* User Type Selection */}
                        <View style={styles.userTypeContainer}>
                            <ThemedText style={styles.userTypeLabel}>I am a...</ThemedText>
                            <View style={styles.userTypeButtons}>
                                <TouchableOpacity
                                    style={[
                                        styles.userTypeButton,
                                        userType === 'supplement_user' ?
                                            { backgroundColor: primaryColor, borderColor: primaryColor } :
                                            { backgroundColor: 'transparent', borderColor: colors.border }
                                    ]}
                                    onPress={() => setUserType('supplement_user')}
                                >
                                    <ThemedText style={[
                                        styles.userTypeButtonText,
                                        { color: userType === 'supplement_user' ? '#FFFFFF' : textColor }
                                    ]}>
                                        💊 Supplement User
                                    </ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.userTypeButton,
                                        userType === 'doctor' ?
                                            { backgroundColor: primaryColor, borderColor: primaryColor } :
                                            { backgroundColor: 'transparent', borderColor: colors.border }
                                    ]}
                                    onPress={() => setUserType('doctor')}
                                >
                                    <ThemedText style={[
                                        styles.userTypeButtonText,
                                        { color: userType === 'doctor' ? '#FFFFFF' : textColor }
                                    ]}>
                                        👩‍⚕️ Doctor
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                <ThemedText style={styles.inputIcon}>👤</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="Elon Musk"
                                    placeholderTextColor={colors.icon}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                <ThemedText style={styles.inputIcon}>📧</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="elon@tesla.com"
                                    placeholderTextColor={colors.icon}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        {/* Clinic Name Field - Only shown for doctors */}
                        {userType === 'doctor' && (
                            <>
                                <View style={styles.inputContainer}>
                                    <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                        <ThemedText style={styles.inputIcon}>🏥</ThemedText>
                                        <TextInput
                                            style={[styles.input, { color: textColor }]}
                                            placeholder="Clinic/Hospital Name"
                                            placeholderTextColor={colors.icon}
                                            value={clinicName}
                                            onChangeText={setClinicName}
                                            autoCapitalize="words"
                                            autoCorrect={false}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputContainer}>
                                    <View style={[styles.biographyWrapper, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                        <ThemedText style={styles.biographyIcon}>📝</ThemedText>
                                        <TextInput
                                            style={[styles.biographyInput, { color: textColor }]}
                                            placeholder="Tell patients about yourself, your experience, and specialties..."
                                            placeholderTextColor={colors.icon}
                                            value={biography}
                                            onChangeText={setBiography}
                                            autoCapitalize="sentences"
                                            autoCorrect={true}
                                            multiline={true}
                                            numberOfLines={4}
                                            textAlignVertical="top"
                                        />
                                    </View>
                                </View>
                            </>
                        )}

                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                <ThemedText style={styles.inputIcon}>🔒</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.icon}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                <ThemedText style={styles.inputIcon}>🔒</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.icon}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.signupButton, { backgroundColor: primaryColor }]}
                            onPress={handleSignup}
                            disabled={isLoading}
                        >
                            <ThemedText style={styles.signupButtonText}>
                                {isLoading ? 'CREATING ACCOUNT...' : (userType === 'doctor' ? 'SIGN UP' : 'CONTINUE')}
                            </ThemedText>
                        </TouchableOpacity>

                        <View style={styles.loginContainer}>
                            <ThemedText style={[styles.loginText, { color: colors.icon }]}>
                                Already have an account?{' '}
                            </ThemedText>
                            <TouchableOpacity onPress={navigateToLogin}>
                                <ThemedText style={[styles.loginLink, { color: primaryColor }]}>
                                    Login here
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
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
        paddingHorizontal: 32,
        paddingVertical: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logo: {
        fontSize: 36,
        fontWeight: '300',
        letterSpacing: 1,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
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
    signupButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    signupButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
    },
    loginLink: {
        fontSize: 14,
        fontWeight: '600',
    },
    userTypeContainer: {
        marginBottom: 25,
    },
    userTypeLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
    },
    userTypeButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    userTypeButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
    },
    userTypeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    biographyWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 100,
    },
    biographyIcon: {
        fontSize: 16,
        marginRight: 12,
        marginTop: 2,
    },
    biographyInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '400',
        minHeight: 80,
    },
});