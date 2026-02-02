import React from 'react';
import { useRouter } from 'expo-router';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const HEADER_IMAGE =
  'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80';

const SignInScreen = () => {
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <ImageBackground 
            source={{ 
              uri: HEADER_IMAGE,
              cache: 'force-cache'
            }} 
            style={styles.headerImage}
            resizeMode="cover"
            imageStyle={{ resizeMode: 'cover' }}>
            <View style={styles.headerOverlay} />
            <View style={styles.logoContainer}>
              <View style={styles.logoMark} />
              <View>
                <Text style={styles.logoTextPrimary}>Green</Text>
                <Text style={styles.logoTextSecondary}>Legacy</Text>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.card}>
            <Text style={styles.title}>Sign In</Text>

            <View style={styles.inputGroup}>
              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.9}
              onPress={async () => {
                console.log('Navigating to tabs...');
                try {
                  // Try navigating to the tabs route
                  await router.replace('/(tabs)');
                  console.log('Navigation successful');
                } catch (error) {
                  console.error('Navigation failed:', error);
                  // Try alternative route
                  try {
                    await router.push('/(tabs)/index');
                  } catch (e) {
                    console.error('Alternative navigation also failed:', e);
                    Alert.alert('Navigation Error', 'Could not navigate to home screen. Please try again.');
                  }
                }
              }}>
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.rowBetween}>
              <View style={styles.rememberRow}>
                <View style={styles.checkbox} />
                <Text style={styles.checkboxLabel}>Remember Me</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.linkText}>Forget Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={[styles.footerText, styles.footerLinkText]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignInScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerImage: {
    width: '100%',
    height: 220,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginLeft: 24,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  logoTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoTextSecondary: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  card: {
    marginTop: -40,
    marginHorizontal: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2E8B57',
    marginBottom: 24,
  },
  inputGroup: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#111111',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    height: 54,
    borderRadius: 999,
    backgroundColor: '#2E8B57',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#A0A0A0',
    marginRight: 6,
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#444444',
  },
  linkText: {
    fontSize: 12,
    color: '#666666',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#777777',
  },
  footerLinkText: {
    fontWeight: '600',
    color: '#2E8B57',
  },
});


