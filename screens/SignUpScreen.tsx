import { useRouter } from 'expo-router';
import React from 'react';
import {
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

const SignUpScreen = () => {
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
            <Text style={styles.title}>Sign Up</Text>

            <View style={styles.inputGroup}>
              <TextInput
                placeholder="Name"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
              />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              <TextInput
                placeholder="Confirm email Address"
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9}>
              <Text style={styles.primaryButtonText}>Sign Up</Text>
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

            <View style={styles.socialRow}>
              <View style={styles.socialButton}>
                <Text style={styles.socialIconText}>f</Text>
              </View>
              <View style={styles.socialButton}>
                <Text style={styles.socialIconText}>G</Text>
              </View>
              <View style={styles.socialButton}>
                <Text style={styles.socialIconText}></Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/')}>
                <Text style={[styles.footerText, styles.footerLinkText]}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;

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
    color: '#111111',
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
    marginBottom: 16,
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
    marginBottom: 32,
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
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 32,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#444444',
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


