import { ThemedText } from '@/components/ThemedText';
import { Config } from '@/constants/Config';
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

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const primaryColor = useThemeColor({}, 'primary');
    const borderColor = useThemeColor({}, 'border');
    const cardBackground = useThemeColor({}, 'cardBackground');
    const iconColor = useThemeColor({}, 'icon');

    const handleLogin = async () => {
        console.log('Login attempt started...');

        if (!email || !password) {
            platformAlert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Sending login request to API...');
            const response = await fetch(`${Config.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password,
                }),
            });

            console.log('API response status:', response.status);
            const data = await response.json();

            if (!response.ok) {
                console.error('Login failed with API response:', data);
                throw new Error(data.error || 'Login failed');
            }

            console.log('Login successful, storing user data...');
            // Store user data in AsyncStorage and wait for completion
            await AsyncStorage.setItem('user', JSON.stringify(data.user));

            // Verify the data was stored
            const storedData = await AsyncStorage.getItem('user');
            if (!storedData) {
                throw new Error('Failed to store user data');
            }

            console.log('User data stored successfully, navigating...');
            // Navigate to main app after successful login
            // Redirect doctors to patients tab, supplement users to main tabs
            if (data.user.userType === 'doctor') {
                router.replace('/(tabs)/patients');
            } else {
                router.replace('/(tabs)');
            }

            console.log('Login successful for user:', data.user.email);
        } catch (error) {
            console.error('Login error:', error);
            const message = error instanceof Error ? error.message : 'Login failed';
            platformAlert('Login Failed', message);
        } finally {
            setIsLoading(false);
            console.log('Login process completed');
        }
    };

    const navigateToSignup = () => {
        router.push('/signup');
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
                        <ThemedText style={[styles.subtitle, { color: iconColor }]}>
                            Log in to your account
                        </ThemedText>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, { borderColor: borderColor, backgroundColor: cardBackground }]}>
                                <ThemedText style={styles.inputIcon}>👤</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="elon@tesla.com"
                                    placeholderTextColor={iconColor}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, { borderColor: borderColor, backgroundColor: cardBackground }]}>
                                <ThemedText style={styles.inputIcon}>🔒</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={iconColor}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.loginButton, { backgroundColor: primaryColor }]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <ThemedText style={styles.loginButtonText}>
                                {isLoading ? 'LOGGING IN...' : 'LOG IN'}
                            </ThemedText>
                        </TouchableOpacity>

                        <View style={styles.signupContainer}>
                            <ThemedText style={[styles.signupText, { color: iconColor }]}>
                                Don't have an account?{' '}
                            </ThemedText>
                            <TouchableOpacity onPress={navigateToSignup}>
                                <ThemedText style={[styles.signupLink, { color: primaryColor }]}>
                                    Sign Up
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
        paddingHorizontal: 16, // reduced from 32 to avoid dead zones
        paddingVertical: 16, // slightly reduced for better fit
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32, // reduced from 50 for less vertical dead zone
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
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginBottom: 30,
    },
    forgotPassword: {
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 30,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupText: {
        fontSize: 14,
    },
    signupLink: {
        fontSize: 14,
        fontWeight: '600',
    },
});