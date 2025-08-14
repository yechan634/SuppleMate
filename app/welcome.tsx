import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    Dimensions,
    Image,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();

    const backgroundColor = useThemeColor({}, 'background');
    const primaryColor = useThemeColor({}, 'primary');
    const iconColor = useThemeColor({}, 'icon');

    const navigateToSignup = () => {
        router.push('/signup');
    };

    const navigateToLogin = () => {
        router.push('/login');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <StatusBar style="auto" />

            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/images/logo.png')}
                        style={{ width: 270, height: 200, resizeMode: 'contain', marginBottom: 8 }}
                        accessibilityLabel="SuppleMate Logo"
                    />
                    <ThemedText style={[styles.subtitle, { color: iconColor }]}>
                        Check interactions between your{'\n'}
                        medications and supplements,{'\n'}
                        and track dosage/refill schedules.
                    </ThemedText>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.signupButton, { backgroundColor: primaryColor }]}
                        onPress={navigateToSignup}
                    >
                        <ThemedText style={styles.signupButtonText}>SIGN UP</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: primaryColor }]}
                        onPress={navigateToLogin}
                    >
                        <ThemedText style={styles.loginButtonText}>LOG IN</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: screenHeight * 0.15,
    },
    logo: {
        fontSize: 48,
        fontWeight: '300',
        letterSpacing: 2,
        marginBottom: 30,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
    },
    signupButton: {
        borderRadius: 12,
        paddingVertical: 18,
        alignItems: 'center',
    },
    signupButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    loginButton: {
        borderRadius: 12,
        paddingVertical: 18,
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});
