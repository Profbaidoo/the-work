import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  BackHandler,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { WebView } from 'react-native-webview';

// Default Wi-Fi Network IP for pairing with local development server
const DEFAULT_LOCAL_URL = 'http://172.21.14.156:3000';

export default function App() {
  const [serverUrl, setServerUrl] = useState<string>(DEFAULT_LOCAL_URL);
  const [inputUrl, setInputUrl] = useState<string>(DEFAULT_LOCAL_URL);
  const [isInPortal, setIsInPortal] = useState<boolean>(true);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const webViewRef = useRef<WebView>(null);

  // Handle Android physical hardware back button
  useEffect(() => {
    const onBackPress = () => {
      if (isInPortal && canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [isInPortal, canGoBack]);

  const handleConnect = (targetUrl: string) => {
    let formatted = targetUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'http://' + formatted;
    }
    setServerUrl(formatted);
    setInputUrl(formatted);
    setHasError(false);
    setIsInPortal(true);
  };

  const handleReload = () => {
    setHasError(false);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleGoHome = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.location.href = '/dashboard'; true;`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* TOP NATIVE APP BAR */}
      <View style={styles.topBar}>
        <View style={styles.schoolBadgeContainer}>
          <Text style={styles.schoolIcon}>🎓</Text>
          <View>
            <Text style={styles.schoolName}>Charity Preparatory</Text>
            <Text style={styles.schoolSubtext}>Ghanaian Basic School Portal</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setIsInPortal(!isInPortal)}
          style={styles.settingsPill}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsPillText}>
            {isInPortal ? '⚙️ Server' : '✕ Close'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SETTINGS / SERVER CONFIGURATION VIEW */}
      {!isInPortal ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.settingsContainer}
        >
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>📱 Mobile Portal Connection</Text>
            <Text style={styles.settingsDescription}>
              Connect your phone to the School Management System running on your computer or cloud server.
            </Text>

            <Text style={styles.inputLabel}>Server Web URL:</Text>
            <TextInput
              style={styles.textInput}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="e.g. http://172.21.14.156:3000"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            {/* Quick URL Presets */}
            <Text style={styles.presetLabel}>Quick Presets:</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => setInputUrl(DEFAULT_LOCAL_URL)}
              >
                <Text style={styles.presetButtonText}>📶 Local Wi-Fi</Text>
                <Text style={styles.presetSubtext}>172.21.14.156:3000</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => setInputUrl('https://the-work-omega.vercel.app')}
              >
                <Text style={styles.presetButtonText}>🌐 Vercel Cloud</Text>
                <Text style={styles.presetSubtext}>Production Live</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => handleConnect(inputUrl)}
              activeOpacity={0.8}
            >
              <Text style={styles.connectButtonText}>Connect & Enter School Portal &rarr;</Text>
            </TouchableOpacity>

            <View style={styles.wifiHintBox}>
              <Text style={styles.wifiHintTitle}>💡 Wi-Fi Connection Tip:</Text>
              <Text style={styles.wifiHintText}>
                Make sure your mobile phone is connected to the same Wi-Fi network as your computer.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* MAIN EMBEDDED WEB PORTAL (WEBVIEW) */
        <View style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: serverUrl }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            onNavigationStateChange={(navState) => {
              setCanGoBack(navState.canGoBack);
              setCanGoForward(navState.canGoForward);
            }}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              setHasError(true);
              setErrorMessage(nativeEvent.description || 'Could not connect to the school server.');
              setIsLoading(false);
            }}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.loadingTitle}>Connecting to Charity Preparatory...</Text>
                <Text style={styles.loadingUrl}>{serverUrl}</Text>
              </View>
            )}
          />

          {/* ERROR FALLBACK OVERLAY */}
          {hasError && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorIcon}>📡</Text>
              <Text style={styles.errorTitle}>Server Unreachable</Text>
              <Text style={styles.errorMessage}>
                Unable to load portal from {serverUrl}.
              </Text>
              <Text style={styles.errorTroubleshoot}>
                • Check if your computer dev server is running.{'\n'}
                • Ensure your phone is connected to the same Wi-Fi.{'\n'}
                • Or switch to your Vercel cloud URL.
              </Text>

              <View style={styles.errorButtonRow}>
                <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
                  <Text style={styles.retryButtonText}>🔄 Retry</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.changeServerButton} onPress={() => setIsInPortal(false)}>
                  <Text style={styles.changeServerButtonText}>⚙️ Change Server</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* NATIVE BOTTOM NAVIGATION CONTROLS */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={() => webViewRef.current?.goBack()}
              disabled={!canGoBack}
              style={[styles.navButton, !canGoBack && styles.disabledNavButton]}
            >
              <Text style={styles.navButtonIcon}>◀</Text>
              <Text style={styles.navButtonLabel}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGoHome}
              style={styles.navButton}
            >
              <Text style={styles.navButtonIcon}>🏠</Text>
              <Text style={styles.navButtonLabel}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleReload}
              style={styles.navButton}
            >
              <Text style={styles.navButtonIcon}>🔄</Text>
              <Text style={styles.navButtonLabel}>Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => webViewRef.current?.goForward()}
              disabled={!canGoForward}
              style={[styles.navButton, !canGoForward && styles.disabledNavButton]}
            >
              <Text style={styles.navButtonIcon}>▶</Text>
              <Text style={styles.navButtonLabel}>Forward</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topBar: {
    height: 54,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  schoolBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  schoolIcon: {
    fontSize: 22,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  schoolSubtext: {
    fontSize: 10,
    color: '#94A3B8',
  },
  settingsPill: {
    backgroundColor: '#1E293B',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
  },
  bottomBar: {
    height: 52,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 4 : 0,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  disabledNavButton: {
    opacity: 0.25,
  },
  navButtonIcon: {
    fontSize: 16,
    color: '#0F172A',
  },
  navButtonLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 14,
  },
  loadingUrl: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 14,
  },
  errorTroubleshoot: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'left',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    width: '100%',
  },
  errorButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  changeServerButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  changeServerButtonText: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 13,
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    padding: 20,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  settingsDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  presetButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  presetSubtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  wifiHintBox: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  wifiHintTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  wifiHintText: {
    fontSize: 10,
    color: '#B45309',
    lineHeight: 14,
  },
});
