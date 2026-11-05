
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, Platform, StyleSheet, ScrollView,
  TouchableOpacity, Animated, TextInput, StatusBar,
  useWindowDimensions, Linking,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import CyberBackground from './components/CyberBackground';

const LEAF_LOGIC_LOGO = require('./assets/leaflogic/leaf-logic-logo.png');
// LEAF LOGIC BACKEND CONFIGURATION
const API_BASE_URL = 'http://10.221.48.2:8002';

type Screen =
  | 'splash' | 'welcome' | 'home' | 'detect'
  | 'expert' | 'market' | 'weather' | 'health'
  | 'history' | 'pest' | 'soil' | 'schemes' | 'calendar' | 'notifications';
type Language = 'en' | 'kn' | 'hi';

const C = {
  bg: '#F7FFF9',
  white: '#FFFFFF',
  green: '#009B48',
  bright: '#00C853',
  dark: '#064B2B',
  text: '#123D28',
  muted: '#668272',
  light: '#E8F8ED',
  border: '#B7E8C9',
};

const translations = {
  en: {
    title: 'LEAF LOGIC',
    subtitle: "Nature's Logic, Smarter Future.",
    start: 'GET STARTED',
    greeting: 'WELCOME TO THE FUTURE OF FARMING',
    hero: 'SMART FARMING',
    hero2: 'STARTS HERE.',
    dashboard: 'AGRICULTURE COMMAND CENTER',
    detect: 'AI Disease Detection',
    expert: 'Consult an Expert',
    market: 'Market Updates',
    weather: 'Weather Intelligence',
    health: 'Plant Health',
    detectDesc: 'Identify crop diseases using AI',
    expertDesc: 'Connect with agriculture experts',
    marketDesc: 'Explore crop prices and market news',
    weatherDesc: 'Monitor weather and crop conditions',
    healthDesc: 'Smart guidance for healthy crops',
    history: 'AI Scan History',
    historyDesc: 'View your previous leaf disease scans',
    soil: 'Soil Health',
soilDesc: 'Understand soil pH, NPK nutrients and soil testing',
    pest: 'Pest Management',
pestDesc: 'Learn pest symptoms, prevention and control',
    schemes: 'Government Agriculture Schemes',
    schemesDesc: 'Explore farmer support programmes and official application portals',
    calendar: 'Crop Calendar',
    calendarDesc: 'Explore seasonal crops and common sowing windows in Karnataka',
    notifications: 'Crop-Care Alerts',
    notificationsDesc: 'View useful reminders for watering, crop inspection and weather checks',
    scan: 'START AI SCAN',
    upload: 'UPLOAD LEAF IMAGE',
    language: 'SELECT LANGUAGE',
    back: 'BACK TO DASHBOARD',
    tips: 'SMART FARMING TIPS',
    tip: 'Inspect your crops regularly. Early disease detection can help protect your harvest.',
    ask: 'Ask your agriculture question...',
    send: 'SEND MESSAGE',
    crop: 'SELECT YOUR CROP',
    temperature: 'Temperature',
    humidity: 'Humidity',
    rainfall: 'Rainfall',
    wind: 'Wind Speed',
    quote: 'Healthy Crops. Better Harvests. A Smarter Future.',
    noLogin: 'NO LOGIN • NO REGISTRATION',
  },
  kn: {
    title: 'LEAF LOGIC',
    subtitle: 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ. ಆರೋಗ್ಯಕರ ಬೆಳೆ.',
    start: 'ಪ್ರಾರಂಭಿಸಿ',
    greeting: 'ಭವಿಷ್ಯದ ಕೃಷಿಗೆ ಸ್ವಾಗತ',
    hero: 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ',
    hero2: 'ಇಲ್ಲಿಂದ ಪ್ರಾರಂಭ.',
    dashboard: 'ಕೃಷಿ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ',
    detect: 'AI ರೋಗ ಪತ್ತೆ',
    expert: 'ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ',
    market: 'ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ',
    weather: 'ಹವಾಮಾನ ಮಾಹಿತಿ',
    health: 'ಸಸ್ಯ ಆರೋಗ್ಯ',
    detectDesc: 'AI ಮೂಲಕ ಬೆಳೆ ರೋಗಗಳನ್ನು ಗುರುತಿಸಿ',
    expertDesc: 'ಕೃಷಿ ತಜ್ಞರೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ',
    marketDesc: 'ಬೆಳೆ ಬೆಲೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಸುದ್ದಿ',
    weatherDesc: 'ಹವಾಮಾನ ಮತ್ತು ಬೆಳೆ ಸ್ಥಿತಿ',
    healthDesc: 'ಆರೋಗ್ಯಕರ ಬೆಳೆಗಳಿಗೆ ಮಾರ್ಗದರ್ಶನ',
    history: 'AI ಸ್ಕ್ಯಾನ್ ಇತಿಹಾಸ',
    historyDesc: 'ಹಿಂದಿನ ಎಲೆ ರೋಗ ಸ್ಕ್ಯಾನ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    pest: 'ಕೀಟ ನಿರ್ವಹಣೆ',
    soil: 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ',
soilDesc: 'ಮಣ್ಣಿನ pH, NPK ಪೋಷಕಾಂಶಗಳು ಮತ್ತು ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ',
pestDesc: 'ಕೀಟಗಳ ಲಕ್ಷಣಗಳು, ತಡೆಗಟ್ಟುವಿಕೆ ಮತ್ತು ನಿಯಂತ್ರಣ',
    schemes: 'ಸರ್ಕಾರದ ಕೃಷಿ ಯೋಜನೆಗಳು',
    schemesDesc: 'ರೈತರ ಯೋಜನೆಗಳು ಮತ್ತು ಅಧಿಕೃತ ಅರ್ಜಿ ಪೋರ್ಟಲ್‌ಗಳನ್ನು ತಿಳಿಯಿರಿ',
    calendar: 'ಬೆಳೆ ಕ್ಯಾಲೆಂಡರ್',
    calendarDesc: 'ಕರ್ನಾಟಕದ ಋತುಮಾನ ಬೆಳೆಗಳು ಮತ್ತು ಬಿತ್ತನೆ ಸಮಯ ತಿಳಿಯಿರಿ',
    notifications: 'ಬೆಳೆ ಆರೈಕೆ ಸೂಚನೆಗಳು',
    notificationsDesc: 'ನೀರುಣಿಸುವಿಕೆ, ಬೆಳೆ ಪರಿಶೀಲನೆ ಮತ್ತು ಹವಾಮಾನ ಪರಿಶೀಲನೆಗೆ ನೆನಪುಗಳು',
    scan: 'AI ಸ್ಕ್ಯಾನ್ ಪ್ರಾರಂಭಿಸಿ',
    upload: 'ಎಲೆಯ ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    language: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    back: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ',
    tips: 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಸಲಹೆಗಳು',
    tip: 'ಬೆಳೆಗಳನ್ನು ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ. ರೋಗಗಳನ್ನು ಬೇಗ ಗುರುತಿಸುವುದರಿಂದ ಬೆಳೆಗಳನ್ನು ರಕ್ಷಿಸಬಹುದು.',
    ask: 'ನಿಮ್ಮ ಕೃಷಿ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ...',
    send: 'ಸಂದೇಶ ಕಳುಹಿಸಿ',
    crop: 'ಬೆಳೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    temperature: 'ತಾಪಮಾನ',
    humidity: 'ತೇವಾಂಶ',
    rainfall: 'ಮಳೆ',
    wind: 'ಗಾಳಿಯ ವೇಗ',
    quote: 'ಆರೋಗ್ಯಕರ ಬೆಳೆ. ಉತ್ತಮ ಫಸಲು. ಸ್ಮಾರ್ಟ್ ಭವಿಷ್ಯ.',
    noLogin: 'ಲಾಗಿನ್ ಬೇಡ • ನೋಂದಣಿ ಬೇಡ',
  },
  hi: {
    title: 'LEAF LOGIC',
    subtitle: 'स्मार्ट कृषि। स्वस्थ फसल।',
    start: 'शुरू करें',
    greeting: 'खेती के भविष्य में आपका स्वागत है',
    hero: 'स्मार्ट खेती',
    hero2: 'यहीं से शुरू।',
    dashboard: 'कृषि नियंत्रण केंद्र',
    detect: 'AI रोग पहचान',
    expert: 'विशेषज्ञ से सलाह लें',
    market: 'बाजार अपडेट',
    weather: 'मौसम जानकारी',
    health: 'पौधों का स्वास्थ्य',
    detectDesc: 'AI से फसल रोगों की पहचान करें',
    expertDesc: 'कृषि विशेषज्ञों से जुड़ें',
    marketDesc: 'फसल की कीमतें और बाजार समाचार',
    weatherDesc: 'मौसम और फसल की स्थिति',
    healthDesc: 'स्वस्थ फसलों के लिए मार्गदर्शन',
    history: 'AI स्कैन इतिहास',
    historyDesc: 'अपने पिछले पत्ती रोग स्कैन देखें',
    soil: 'मिट्टी का स्वास्थ्य',
soilDesc: 'मिट्टी का pH, NPK पोषक तत्व और मिट्टी की जांच',
    pest: 'कीट प्रबंधन',
pestDesc: 'कीटों के लक्षण, रोकथाम और नियंत्रण',
    schemes: 'सरकारी कृषि योजनाएँ',
    schemesDesc: 'किसान सहायता योजनाएँ और आधिकारिक आवेदन पोर्टल देखें',
    calendar: 'फसल कैलेंडर',
    calendarDesc: 'कर्नाटक की मौसमी फसलें और सामान्य बुवाई समय जानें',
    notifications: 'फसल देखभाल अलर्ट',
    notificationsDesc: 'सिंचाई, फसल निरीक्षण और मौसम जांच के लिए उपयोगी रिमाइंडर देखें',
    scan: 'AI स्कैन शुरू करें',
    upload: 'पत्ते की तस्वीर अपलोड करें',
    language: 'भाषा चुनें',
    back: 'डैशबोर्ड पर वापस जाएं',
    tips: 'स्मार्ट खेती के सुझाव',
    tip: 'अपनी फसलों की नियमित जांच करें। रोगों की जल्दी पहचान फसल को बचाने में मदद करती है।',
    ask: 'अपना कृषि प्रश्न पूछें...',
    send: 'संदेश भेजें',
    crop: 'अपनी फसल चुनें',
    temperature: 'तापमान',
    humidity: 'नमी',
    rainfall: 'बारिश',
    wind: 'हवा की गति',
    quote: 'स्वस्थ फसल। बेहतर पैदावार। स्मार्ट भविष्य।',
    noLogin: 'लॉगिन नहीं • पंजीकरण नहीं',
  },
};

const features = [
  { id: 'detect' as Screen, icon: '⌗', key: 'detect', desc: 'detectDesc' },
  { id: 'history' as Screen, icon: '📋', key: 'history', desc: 'historyDesc' },
  { id: 'expert' as Screen, icon: '✧', key: 'expert', desc: 'expertDesc' },
  { id: 'market' as Screen, icon: '▥', key: 'market', desc: 'marketDesc' },
  { id: 'weather' as Screen, icon: '☼', key: 'weather', desc: 'weatherDesc' },
  { id: 'health' as Screen, icon: '❧', key: 'health', desc: 'healthDesc' },
  { id: 'pest' as Screen, icon: '🐛', key: 'pest', desc: 'pestDesc' },
  { id: 'soil' as Screen, icon: '🌱', key: 'soil', desc: 'soilDesc' },
  { id: 'schemes' as Screen, icon: '🏛️', key: 'schemes', desc: 'schemesDesc' },
  { id: 'calendar' as Screen, icon: '🗓️', key: 'calendar', desc: 'calendarDesc' },
  { id: 'notifications' as Screen, icon: '🔔', key: 'notifications', desc: 'notificationsDesc' },
];

export default function App() {
  const { width } = useWindowDimensions();
  const wide = width >= 850;

  const [screen, setScreen] = useState<Screen>('splash');
  const [language, setLanguage] = useState<Language>('en');
  const [question, setQuestion] = useState('');
  const [crop, setCrop] = useState('Tomato');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [marketCrop, setMarketCrop] = useState('Potato');
  const [marketName, setMarketName] = useState('Bengaluru APMC');
  const [marketData, setMarketData] = useState<any>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState('');
  const [marketOptions, setMarketOptions] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
const [historyLoading, setHistoryLoading] = useState(false);
const [historyError, setHistoryError] = useState('');

  const fade = useRef(new Animated.Value(0)).current;
  const scan = useRef(new Animated.Value(0)).current;
  const t = translations[language];

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    if (screen === 'splash') {
      const timer = setTimeout(() => setScreen('welcome'), 2500);
      return () => clearTimeout(timer);
    }
  }, [screen, fade]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(scan, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scan]);

  const navigate = (next: Screen) => {
    fade.setValue(0);
    setScreen(next);
  };

  const pickLeafImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch {
      alert('Could not open your image gallery. Please try again.');
    }
  };

  const takeLeafPhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        alert('Camera permission is required to take a leaf photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch {
      alert('Could not open your camera. Please try again.');
    }
  };

    const scanLeafImage = async () => {
  if (!selectedImage) {
    alert('Please select or take a leaf photo first.');
    return;
  }

  if (isScanning) return;

  setIsScanning(true);

  try {
    const imageFile = new File(selectedImage);
    const formData = new FormData();

    formData.append('file', imageFile);

    const response = await expoFetch(
      `${API_BASE_URL}/analyze`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(
        result.detail || result.message || 'Image upload failed.'
      );
    }

    setAiResult(result);

    alert(
      'AI ANALYSIS COMPLETED SUCCESSFULLY!\n\n' +
      'Crop: ' + (result.crop || 'Unknown') +
      '\nDisease: ' + (result.disease || 'Unknown') +
      '\nConfidence: ' + (result.confidence ?? 'N/A') + '%' +
      '\n\n' + (result.message || '')
    );

  } catch (error) {
    console.error('Leaf image upload error:', error);

    const message =
      error instanceof Error ? error.message : 'Unknown error';

    alert(
      'Could not send the image to the backend.\n\n' +
      message +
      '\n\nCheck that your laptop backend is running.'
    );

  } finally {
    setIsScanning(false);
  }
};



  const fetchWeather = async () => {
    setWeatherLoading(true);
    setWeatherError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/weather?city=Bengaluru`
      );
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.detail || result.message || 'Weather request failed.');
      }

      setWeatherData(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load weather.';
      setWeatherError(message);
    } finally {
      setWeatherLoading(false);
    }
  };
const fetchHistory = async () => {
  setHistoryLoading(true);
  setHistoryError('');

  try {
    const response = await fetch(`${API_BASE_URL}/history`);
    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.detail || 'Unable to load scan history.');
    }

    setHistoryData(result.history || []);
  } catch (error) {
    setHistoryError(
      error instanceof Error ? error.message : 'Unable to load history.'
    );
  } finally {
    setHistoryLoading(false);
  }
};
  useEffect(() => {
    if (screen === 'weather') {
      fetchWeather();
    }
  }, [screen]);
  useEffect(() => {
  if (screen === 'history') {
    fetchHistory();
  }
}, [screen]);

  // ==========================================
  // REAL AGMARKNET MARKET DATA
  // ==========================================

  

  const fetchMarketFilters = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/market/filters`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.detail || 'Unable to load market filters.');
      }

      setMarketOptions(result.markets || []);
    } catch (error) {
      setMarketError(
        error instanceof Error ? error.message : 'Market filters unavailable.'
      );
    }
  };

  const fetchMarketPrices = async () => {
    setMarketLoading(true);
    setMarketError('');

    try {
      const url =
        `${API_BASE_URL}/market?crop=${encodeURIComponent(marketCrop)}` +
        `&market=${encodeURIComponent(marketName)}`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.detail || 'Unable to retrieve market prices.');
      }

      setMarketData(result);
    } catch (error) {
      setMarketData(null);
      setMarketError(
        error instanceof Error ? error.message : 'Market prices unavailable.'
      );
    } finally {
      setMarketLoading(false);
    }
  };

  useEffect(() => {
    if (screen === 'market') {
      fetchMarketFilters();
      fetchMarketPrices();
    }
  }, [screen, marketCrop, marketName]);

  const Button = ({
    label,
    onPress,
    outline = false,
  }: {
    label: string;
    onPress: () => void;
    outline?: boolean;
  }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.button, outline && styles.outlineButton]}
    >
      <Text style={[styles.buttonText, outline && styles.greenText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const LanguageSelector = () => (
    <View style={styles.languageRow}>
      {(['en', 'kn', 'hi'] as Language[]).map((lang) => (
        <TouchableOpacity
          key={lang}
          onPress={() => setLanguage(lang)}
          style={[
            styles.languageButton,
            language === lang && styles.languageActive,
          ]}
        >
          <Text
            style={[
              styles.languageText,
              language === lang && styles.greenText,
            ]}
          >
            {lang === 'en' ? 'ENGLISH' : lang === 'kn' ? 'ಕನ್ನಡ' : 'हिंदी'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.brand}
        onPress={() => navigate('home')}
      >
        <Image
          source={LEAF_LOGIC_LOGO}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.brandTitle}>LEAF LOGIC</Text>
          <Text style={styles.brandSubtitle}>
            NATURE'S LOGIC • SMARTER FUTURE
          </Text>
        </View>
      </TouchableOpacity>
      <LanguageSelector />
    </View>
  );

  const SectionTitle = ({ children }: { children: string }) => (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionLeaf}>❧</Text>
      <Text style={styles.sectionTitle}>{children}</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  const BackButton = () => (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigate('home')}
    >
      <Text style={styles.greenText}>← {t.back}</Text>
    </TouchableOpacity>
  );

  const FeatureCard = ({ item }: { item: typeof features[number] }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigate(item.id)}
      style={[styles.featureCard, wide && styles.wideFeatureCard]}
    >
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>{item.icon}</Text>
      </View>
      <Text style={styles.featureTitle}>
        {t[item.key as keyof typeof t]}
      </Text>
      <Text style={styles.featureDescription}>
        {t[item.desc as keyof typeof t]}
      </Text>
      <Text style={styles.explore}>EXPLORE MODULE →</Text>
      <Text style={styles.cardLeaf}>🌿</Text>
    </TouchableOpacity>
  );

  const PageHeading = ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <View style={styles.pageHeading}>
      <Text style={styles.eyebrow}>LEAF LOGIC / SMART AGRICULTURE</Text>
      <Text style={styles.pageTitle}>{title}</Text>
      <Text style={styles.pageDescription}>{description}</Text>
    </View>
  );

  const Dashboard = () => (
    <>
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.eyebrow}>{t.greeting}</Text>
          <Text style={styles.heroTitle}>
            {t.hero}{'\n'}
            <Text style={styles.greenText}>{t.hero2}</Text>
          </Text>
          <Text style={styles.heroDescription}>
            Intelligent Agriculture. Healthier Crops. Higher Yields.
          </Text>
          <Button
            label={`⌗  ${t.scan}  →`}
            onPress={() => navigate('detect')}
          />
        </View>

        <View style={styles.scannerPanel}>
          <Text style={styles.scannerBadge}>AI POWERED • LEAF ANALYSIS</Text>
          <View style={styles.scannerFrame}>
            <Animated.View
              style={[
                styles.scannerLine,
                {
                  transform: [{
                    translateY: scan.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-75, 75],
                    }),
                  }],
                },
              ]}
            />
            <Text style={styles.scannerLeaf}>🌿</Text>
            <View style={styles.scannerCornerTL} />
            <View style={styles.scannerCornerTR} />
            <View style={styles.scannerCornerBL} />
            <View style={styles.scannerCornerBR} />
          </View>
          <Text style={styles.scannerStatus}>AI SCANNER READY</Text>
          <View style={styles.scannerTrack}>
            <View style={styles.scannerProgress} />
          </View>
        </View>

        <View style={styles.benefitList}>
          {[
            ['🌱', 'AI POWERED'],
            ['✓', 'EARLY DETECTION'],
            ['▥', 'HIGHER YIELD'],
            ['❧', 'HEALTHY CROPS'],
          ].map(([icon, label]) => (
            <View style={styles.benefit} key={label}>
              <Text style={styles.benefitIcon}>{icon}</Text>
              <Text style={styles.benefitText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.quickRow}>
        {[
          ['⌗', '01', 'AI DETECTION'],
          ['✧', '02', 'SMART ADVISORY'],
          ['❧', '03', 'CROP CARE'],
        ].map(([icon, number, label]) => (
          <View style={styles.quickCard} key={number}>
            <Text style={styles.quickIcon}>{icon}</Text>
            <View style={styles.quickDivider} />
            <View>
              <Text style={styles.quickNumber}>{number}</Text>
              <Text style={styles.quickLabel}>{label}</Text>
            </View>
          </View>
        ))}
      </View>

      <SectionTitle>{t.dashboard}</SectionTitle>

      <View style={styles.featureGrid}>
        {features.map((item) => (
          <FeatureCard key={item.id} item={item} />
        ))}
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.eyebrow}>✦ FIELD INTELLIGENCE</Text>
        <Text style={styles.tipTitle}>{t.tips}</Text>
        <Text style={styles.tipText}>{t.tip}</Text>
      </View>

      <View style={styles.footer}>
        <Image
          source={LEAF_LOGIC_LOGO}
          style={styles.footerLogo}
          resizeMode="contain"
        />
        <Text style={styles.footerTitle}>LEAF LOGIC</Text>
        <Text style={styles.footerText}>
          NATURE'S LOGIC • SMARTER FUTURE
        </Text>
      </View>
    </>
  );

  const DetectPage = () => (
    <>
      <PageHeading
        title={t.detect}
        description="Upload a clear crop leaf photo to begin disease analysis."
      />

      <View style={styles.panel}>
        <Text style={styles.bigIcon}>⌗</Text>
        <Text style={styles.panelTitle}>AI LEAF SCANNER</Text>
        <Text style={styles.panelText}>
          Place a crop leaf image inside the scanning area.
        </Text>

        <View style={styles.uploadFrame}>
          {selectedImage ? (
            <>
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={pickLeafImage}
              >
                <Text style={styles.changeImageText}>CHANGE IMAGE</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.uploadLeaf}>🌿</Text>
              <Text style={styles.mutedText}>IMAGE PREVIEW AREA</Text>
              <Text style={styles.mutedText}>JPG / PNG</Text>
            </>
          )}
        </View>

        <View style={styles.uploadButtons}>
          <Button
            label="📷 TAKE PHOTO"
            onPress={takeLeafPhoto}
          />
          <Button
            label="🖼️ CHOOSE FROM PHOTOS"
            outline
            onPress={pickLeafImage}
          />
        </View>

        <View style={{ height: 12 }} />

        <Button
          label={isScanning ? 'SENDING IMAGE...' : t.scan}
          outline
          onPress={scanLeafImage}
        />

        <Text style={styles.note}>
          Your image is sent to the trained AI model for analysis. The result shows a
          possible crop disease; please confirm it with an agricultural expert.
        </Text>
      </View>
      {aiResult ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>AI ANALYSIS RESULT</Text>
          <Text style={styles.listText}>
            Crop: {aiResult.crop}
          </Text>
          <Text style={styles.listText}>
            Disease: {aiResult.disease}
          </Text>
          <Text style={styles.listText}>
           Confidence: {aiResult.confidence}%
          </Text>
          {aiResult.needs_review === true && (
  <View
    style={{
      backgroundColor: '#FFF4E5',
      borderColor: '#D97706',
      borderWidth: 1,
      borderRadius: 12,
      padding: 15,
      marginTop: 12,
      marginBottom: 12,
    }}
  >
    <Text style={{
      color: '#B45309',
      fontSize: 15,
      fontWeight: '900',
      marginBottom: 8,
    }}>
      ⚠ LOW CONFIDENCE – PLEASE VERIFY
    </Text>

    <Text style={{
      color: '#78350F',
      fontSize: 13,
      lineHeight: 21,
    }}>
      {aiResult.confidence_message}
    </Text>
  </View>
)}
          <Text style={styles.note}>
            Model: {aiResult.model}
          </Text>
        </View>
      ) : null}

      {aiResult?.guidance ? (
        <View style={styles.panel}>
          <SectionTitle>DISEASE TREATMENT & PREVENTION</SectionTitle>

          <Text style={styles.panelTitle}>Recommended Treatment</Text>
          <Text style={styles.listText}>
            {aiResult.guidance.treatment ||
              'Please consult a local agricultural expert for crop-specific treatment.'}
          </Text>

          <Text style={styles.panelTitle}>Prevention Recommendations</Text>
          {Array.isArray(aiResult.guidance.prevention) &&
          aiResult.guidance.prevention.length > 0 ? (
            aiResult.guidance.prevention.map((item: string, index: number) => (
              <Text style={styles.listText} key={`prevention-${index}`}>
                {index + 1}. {item}
              </Text>
            ))
          ) : (
            <Text style={styles.listText}>
              Follow local agricultural guidance and inspect the crop regularly.
            </Text>
          )}

          <Text style={styles.note}>
            This is general educational guidance. Confirm the disease and
            treatment with an agricultural expert before applying any pesticide.
          </Text>
        </View>
      ) : aiResult ? (
        <View style={styles.panel}>
          <SectionTitle>DISEASE GUIDANCE</SectionTitle>
          <Text style={styles.note}>
            Treatment guidance was not included in the backend response.
            Please check the backend guidance field.
          </Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <SectionTitle>HOW IT WORKS</SectionTitle>
        {[
          '01  Select or capture a crop image',
          '02  AI model analyses the leaf',
          '03  Review possible disease results',
          '04  Get prevention and treatment guidance',
        ].map((item) => (
          <Text style={styles.listText} key={item}>{item}</Text>
        ))}
      </View>
    </>
  );

  const ExpertPage = () => (
    <>
      <PageHeading
        title={t.expert}
        description="Get help with crop diseases and agricultural questions."
      />
      <View style={styles.panel}>
        <Text style={styles.bigIcon}>✧</Text>
        <Text style={styles.panelTitle}>EXPERT CONSULTATION</Text>
        <Text style={styles.panelText}>
          Describe your farming problem below.
        </Text>
        <TextInput
          style={styles.messageInput}
          placeholder={t.ask}
          placeholderTextColor={C.muted}
          value={question}
          onChangeText={setQuestion}
          multiline
        />
        <Button
          label={t.send}
          onPress={async () => {
  if (!question.trim()) {
    alert('Please enter your question.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/consultations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        farmer_name: 'Farmer',
        contact: '',
        question: question.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Submission failed');
    }

    alert('Success! Your consultation request has been submitted.');
  } catch (error) {
    console.error('Consultation error:', error);
    alert('Unable to submit. Please check your backend connection.');
  }
}}
        />
        <Text style={styles.note}>
          Your consultation request can be submitted to the backend. Live chat with
          an agricultural expert is not available yet.
        </Text>
      </View>
    </>
  );

  const MarketPage = () => (
    <>
      <PageHeading
        title={t.market}
        description="Check actual reported crop prices from Karnataka APMC markets."
      />

      <View style={styles.panel}>
        <SectionTitle>SELECT CROP</SectionTitle>
        <View style={styles.uploadButtons}>
          {['Potato', 'Tomato', 'Onion', 'Rice', 'Maize'].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setMarketCrop(item)}
              style={[
                styles.cropOption,
                { flexGrow: 1, minWidth: 95 },
                marketCrop === item && styles.cropSelected,
              ]}
            >
              <Text style={styles.cropText}>{item}</Text>
              {marketCrop === item ? <Text style={styles.greenText}>✓</Text> : null}
            </TouchableOpacity>
          ))}
        </View>

        <SectionTitle>SELECT APMC MARKET</SectionTitle>
        <View style={styles.uploadButtons}>
          {marketOptions
            .filter((item) => [
              'Bengaluru APMC',
              'Kolar APMC',
              'Belgaum APMC',
              'APMC Hubballi',
              'Doddaballapur APMC',
              'Chitradurga APMC',
            ].includes(item.name))
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setMarketName(item.name)}
                style={[
                  styles.cropOption,
                  { flexGrow: 1, minWidth: 140 },
                  marketName === item.name && styles.cropSelected,
                ]}
              >
                <Text style={styles.cropText}>{item.name}</Text>
                {marketName === item.name ? <Text style={styles.greenText}>✓</Text> : null}
              </TouchableOpacity>
            ))}
        </View>

        <Button
          label={marketLoading ? 'FETCHING PRICES...' : '↻ REFRESH MARKET PRICES'}
          onPress={fetchMarketPrices}
        />

        {marketError ? (
          <Text style={{ color: '#B42318', marginTop: 15, lineHeight: 21 }}>
            {marketError}
          </Text>
        ) : null}
      </View>

      <View style={styles.panel}>
        <SectionTitle>REAL APMC MARKET PRICES</SectionTitle>

        {marketLoading ? (
          <Text style={styles.panelText}>Loading official market data...</Text>
        ) : marketData?.prices?.length > 0 ? (
          <>
            <Text style={styles.note}>
              {marketData.market} • {marketData.crop}
            </Text>

            {marketData.prices.map((item: any, index: number) => (
              <View key={`${item.variety}-${index}`}>
                <View style={styles.marketRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.marketCrop}>
                      {item.variety || 'Standard variety'}
                    </Text>
                    <Text style={styles.note}>
                      Latest report: {item.latest_date || 'No report'}
                    </Text>
                  </View>
                  <Text style={styles.marketPrice}>
                    {item.modal_price !== null && item.modal_price !== undefined
                      ? `₹${Number(item.modal_price).toLocaleString('en-IN')}`
                      : 'NR'}
                  </Text>
                </View>

                <Text style={styles.note}>
                  {item.unit || 'Unit not provided'}
                </Text>
                <Text style={styles.listText}>7-DAY PRICE HISTORY</Text>

                {item.daily_prices.map((day: any) => (
                  <View key={day.date} style={styles.marketRow}>
                    <Text style={styles.panelText}>{day.date}</Text>
                    <Text style={styles.marketPrice}>
                      {day.status === 'reported'
                        ? `₹${Number(day.modal_price).toLocaleString('en-IN')}`
                        : 'NR'}
                    </Text>
                  </View>
                ))}
              </View>
            ))}

            <Text style={styles.note}>Source: {marketData.source}</Text>
            <Text style={styles.note}>
              These are reported modal prices per the unit shown. NR means no report was available for that date.
            </Text>
          </>
        ) : (
          <Text style={styles.panelText}>
            {marketLoading
              ? 'Loading market prices...'
              : 'No reported prices are available for this selection.'}
          </Text>
        )}
      </View>

      <View style={styles.panel}>
        <SectionTitle>MARKET DATA INFORMATION</SectionTitle>
        <Text style={styles.listText}>• Source: AGMARKNET Government Market Data</Text>
        <Text style={styles.listText}>• State: Karnataka</Text>
        <Text style={styles.listText}>• Price type: Reported modal price</Text>
        <Text style={styles.listText}>• Update: Latest available report from AGMARKNET</Text>
        <Text style={styles.note}>
          Market prices may not be reported every day. Always check the report date before making a selling decision.
        </Text>
      </View>
    </>
  );

  const WeatherPage = () => (
    <>
      <PageHeading
        title={t.weather}
        description="Live weather information to support better farming decisions."
      />

      <View style={styles.weatherMain}>
        <Text style={styles.weatherIcon}>☁</Text>
        <Text style={styles.weatherTemp}>
          {weatherData ? `${Number(weatherData.temperature).toFixed(1)}°C` : '--°C'}
        </Text>
        <Text style={styles.panelText}>
          {weatherLoading
            ? 'Loading live weather...'
            : weatherData
              ? `${weatherData.weather || 'Weather'} • ${weatherData.description || ''}`
              : 'Live weather data will appear here'}
        </Text>
        <Text style={styles.weatherLocation}>
          {weatherData
            ? `${weatherData.city || 'Bengaluru'}, ${weatherData.country || 'India'}`
            : 'BENGALURU WEATHER'}
        </Text>
      </View>

      <View style={styles.weatherGrid}>
        {[
          [t.temperature, weatherData ? `${Number(weatherData.temperature).toFixed(1)} °C` : '-- °C'],
          ['Feels like', weatherData ? `${Number(weatherData.feels_like).toFixed(1)} °C` : '-- °C'],
          [t.humidity, weatherData ? `${weatherData.humidity} %` : '-- %'],
          ['Pressure', weatherData ? `${weatherData.pressure} hPa` : '-- hPa'],
          ['Rain (last hour)', weatherData ? `${weatherData.rain_last_hour_mm ?? 0} mm` : '-- mm'],
          [t.wind, weatherData ? `${Number(weatherData.wind_speed).toFixed(2)} m/s` : '-- m/s'],
        ].map(([label, value]) => (
          <View style={styles.weatherCard} key={label}>
            <Text style={styles.weatherValue}>{value}</Text>
            <Text style={styles.weatherLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <SectionTitle>FARMING WEATHER ADVISORY</SectionTitle>
        <Text style={styles.listText}>
          {weatherData?.farming_advisory ||
            'Weather-based farming advice will appear here when data is available.'}
        </Text>
        <Text style={styles.note}>
          Rainfall shown here is the rainfall reported for the previous hour, not a forecast.
          Check local field conditions before irrigation or spraying.
        </Text>
      </View>

      {weatherError ? (
        <View style={styles.panel}>
          <Text style={{ color: '#B42318', fontSize: 13, lineHeight: 21 }}>
            Weather error: {weatherError}
          </Text>
          <Text style={styles.note}>
            Make sure the FastAPI backend is running and its /weather endpoint is available.
          </Text>
        </View>
      ) : null}

      <Button
        label={weatherLoading ? 'LOADING WEATHER...' : '↻  REFRESH WEATHER'}
        onPress={fetchWeather}
        outline
      />
      <Text style={styles.note}>
        Live weather is retrieved from your LEAF LOGIC backend using the OpenWeather API.
      </Text>
    </>
  );

  const HealthPage = () => (
    <>
      <PageHeading
        title={t.health}
        description="Manage crop growth, watering and plant care."
      />
      <View style={styles.panel}>
        <SectionTitle>{t.crop}</SectionTitle>
        {['Tomato', 'Rice', 'Wheat', 'Maize', 'Potato', 'Cotton'].map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setCrop(item)}
            style={[
              styles.cropOption,
              crop === item && styles.cropSelected,
            ]}
          >
            <Text style={styles.cropText}>{item}</Text>
            <Text style={styles.greenText}>
              {crop === item ? '✓ SELECTED' : 'SELECT'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.panel}>
        <SectionTitle>CROP CARE GUIDANCE</SectionTitle>
        <Text style={styles.panelTitle}>{crop.toUpperCase()} MANAGEMENT</Text>
        <Text style={styles.listText}>
          • Watering: Check soil moisture before irrigation.
        </Text>
        <Text style={styles.listText}>
          • Nutrition: Use soil-test-based fertilizer recommendations.
        </Text>
        <Text style={styles.listText}>
          • Protection: Inspect leaves and stems regularly.
        </Text>
        <Text style={styles.note}>
          Exact care schedules depend on crop variety, soil and growth stage.
        </Text>
      </View>
    </>
  );
  const PestPage = () => (
  <>
    <PageHeading
      title={t.pest}
      description={t.pestDesc}
    />

    <View style={styles.panel}>
      <SectionTitle>COMMON CROP PESTS</SectionTitle>

      <Text style={styles.panelTitle}>🐛 1. Aphids</Text>
      <Text style={styles.listText}>
        Symptoms: Small insects on young leaves and shoots.
      </Text>
      <Text style={styles.listText}>
        Prevention: Inspect plants regularly and remove heavily affected leaves.
      </Text>
      <Text style={styles.note}>
        Management: Encourage natural predators and consult an agricultural expert.
      </Text>

      <View style={{ height: 15 }} />

      <Text style={styles.panelTitle}>🦟 2. Whiteflies</Text>
      <Text style={styles.listText}>
        Symptoms: Tiny white insects under leaves and yellowing leaves.
      </Text>
      <Text style={styles.listText}>
        Prevention: Remove weeds and inspect the underside of leaves.
      </Text>
      <Text style={styles.note}>
        Management: Use suitable integrated pest management practices.
      </Text>

      <View style={{ height: 15 }} />

      <Text style={styles.panelTitle}>🐛 3. Caterpillars</Text>
      <Text style={styles.listText}>
        Symptoms: Holes in leaves and damaged shoots.
      </Text>
      <Text style={styles.listText}>
        Prevention: Check leaves and remove visible caterpillars where practical.
      </Text>
      <Text style={styles.note}>
        Management: Use crop-specific biological or other recommended controls.
      </Text>

      <View style={{ height: 15 }} />

      <Text style={styles.panelTitle}>🕷️ 4. Red Spider Mites</Text>
      <Text style={styles.listText}>
        Symptoms: Tiny specks, yellow patches and fine webbing on leaves.
      </Text>
      <Text style={styles.listText}>
        Prevention: Monitor leaf undersides and avoid excessive plant stress.
      </Text>
      <Text style={styles.note}>
        Management: Confirm the pest before choosing a suitable control method.
      </Text>
    </View>

    <View style={styles.panel}>
      <SectionTitle>GENERAL PEST PREVENTION</SectionTitle>

      <Text style={styles.listText}>• Inspect crops regularly.</Text>
      <Text style={styles.listText}>• Keep fields free from weeds and crop debris.</Text>
      <Text style={styles.listText}>• Encourage beneficial insects.</Text>
      <Text style={styles.listText}>• Use healthy seeds and planting materials.</Text>
      <Text style={styles.listText}>• Follow Integrated Pest Management (IPM).</Text>

      <Text style={styles.note}>
        These are general educational recommendations, not AI pest detection.
        Confirm the pest and consult an agricultural expert before applying pesticides.
      </Text>
    </View>
  </>
);

const SoilPage = () => (
  <>
    <PageHeading title={t.soil} description={t.soilDesc} />

    <View style={styles.panel}>
      <SectionTitle>UNDERSTANDING SOIL pH</SectionTitle>
      <Text style={styles.panelTitle}>What is soil pH?</Text>
      <Text style={styles.listText}>Soil pH measures how acidic or alkaline your soil is.</Text>
      <Text style={styles.listText}>• Below 7: Acidic soil</Text>
      <Text style={styles.listText}>• 7: Neutral soil</Text>
      <Text style={styles.listText}>• Above 7: Alkaline soil</Text>
      <Text style={styles.note}>Many crops grow well around pH 6.0–7.5, but the ideal range depends on the crop.</Text>
    </View>

    <View style={styles.panel}>
      <SectionTitle>IMPORTANT NPK NUTRIENTS</SectionTitle>
      <Text style={styles.panelTitle}>N – Nitrogen</Text>
      <Text style={styles.listText}>Supports leaf growth and green plant development.</Text>
      <Text style={styles.panelTitle}>P – Phosphorus</Text>
      <Text style={styles.listText}>Supports root development and flowering.</Text>
      <Text style={styles.panelTitle}>K – Potassium</Text>
      <Text style={styles.listText}>Supports water regulation and crop quality.</Text>
    </View>

    <View style={styles.panel}>
      <SectionTitle>SOIL TESTING GUIDANCE</SectionTitle>
      <Text style={styles.listText}>1. Collect soil samples from different representative spots.</Text>
      <Text style={styles.listText}>2. Avoid field boundaries and compost heaps.</Text>
      <Text style={styles.listText}>3. Mix samples as instructed by the laboratory.</Text>
      <Text style={styles.listText}>4. Submit samples to a recognised soil testing laboratory.</Text>
      <Text style={styles.listText}>5. Follow the laboratory report for fertilizer recommendations.</Text>
      <Text style={styles.note}>LEAF LOGIC provides educational guidance. It does not directly measure soil pH or NPK.</Text>
    </View>

    <View style={styles.panel}>
      <SectionTitle>SOIL IMPROVEMENT</SectionTitle>
      <Text style={styles.listText}>• Add suitable organic matter.</Text>
      <Text style={styles.listText}>• Practise crop rotation.</Text>
      <Text style={styles.listText}>• Prevent soil erosion.</Text>
      <Text style={styles.listText}>• Avoid excessive fertilizer application.</Text>
      <Text style={styles.listText}>• Follow soil-test-based recommendations.</Text>
    </View>
  </>
);

const HistoryPage = () => (
  <>
    <PageHeading
      title="AI SCAN HISTORY"
      description="Review your previously analysed crop leaf images."
    />

    <View style={styles.panel}>
      <SectionTitle>PREVIOUS SCANS</SectionTitle>

      {historyLoading ? (
        <Text style={styles.panelText}>
          Loading scan history...
        </Text>
      ) : historyError ? (
        <Text style={{ color: '#B42318' }}>
          {historyError}
        </Text>
      ) : historyData.length === 0 ? (
        <Text style={styles.panelText}>
          No scans saved yet. Analyse a leaf image first.
        </Text>
      ) : (
        historyData.map((item: any) => (
          <View key={item.id} style={styles.marketRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.marketCrop}>
                {item.crop} • {item.disease}
              </Text>

              <Text style={styles.note}>
                {item.filename}
              </Text>

              <Text style={styles.note}>
                {item.created_at
                  ? new Date(item.created_at).toLocaleString()
                  : ''}
              </Text>
            </View>

            <Text style={styles.marketPrice}>
              {Number(item.confidence).toFixed(1)}%
            </Text>
          </View>
        ))
      )}

      <Button
        label="↻ REFRESH HISTORY"
        onPress={fetchHistory}
        outline
      />
    </View>
  </>
);


  const SchemesPage = () => (
    <>
      <PageHeading title={t.schemes} description={t.schemesDesc} />

      <View style={styles.panel}>
        <SectionTitle>1. PM-KISAN SAMMAN NIDHI</SectionTitle>
        <Text style={styles.panelTitle}>Financial support for eligible farmer families</Text>
        <Text style={styles.listText}>• Benefit: ₹6,000 per year in three instalments of ₹2,000.</Text>
        <Text style={styles.listText}>• Eligibility: Eligible landholding farmer families, subject to scheme exclusion rules and government verification.</Text>
        <Text style={styles.listText}>• Aadhaar-based eKYC is mandatory for registered beneficiaries.</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://pmkisan.gov.in/')} style={{ backgroundColor: C.green, padding: 12, borderRadius: 10, marginTop: 12 }}>
          <Text style={{ color: C.white, fontWeight: '800', textAlign: 'center' }}>OPEN OFFICIAL PM-KISAN PORTAL ↗</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <SectionTitle>2. PRADHAN MANTRI FASAL BIMA YOJANA</SectionTitle>
        <Text style={styles.panelTitle}>Crop insurance protection</Text>
        <Text style={styles.listText}>• Provides insurance protection for notified crops against specified crop losses and risks.</Text>
        <Text style={styles.listText}>• Eligibility depends on the notified crop, area, season and insurable interest.</Text>
        <Text style={styles.listText}>• Premium and application deadlines vary by crop and season. Check the current notification before applying.</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://pmfby.gov.in/')} style={{ backgroundColor: C.green, padding: 12, borderRadius: 10, marginTop: 12 }}>
          <Text style={{ color: C.white, fontWeight: '800', textAlign: 'center' }}>OPEN OFFICIAL PMFBY PORTAL ↗</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <SectionTitle>3. KARNATAKA FRUITS FARMER REGISTRATION</SectionTitle>
        <Text style={styles.panelTitle}>Farmer ID and access to state services</Text>
        <Text style={styles.listText}>• FRUITS means Farmer Registration and Unified Beneficiary Information System.</Text>
        <Text style={styles.listText}>• It provides a Farmer ID used for accessing benefits and services across participating Karnataka departments.</Text>
        <Text style={styles.listText}>• Farmers may need Aadhaar, land/RTC and bank details for registration or verification.</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://fruitspmk.karnataka.gov.in/')} style={{ backgroundColor: C.green, padding: 12, borderRadius: 10, marginTop: 12 }}>
          <Text style={{ color: C.white, fontWeight: '800', textAlign: 'center' }}>OPEN KARNATAKA FRUITS PORTAL ↗</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://raitamitra.karnataka.gov.in/')} style={{ borderColor: C.green, borderWidth: 1, padding: 12, borderRadius: 10, marginTop: 8 }}>
          <Text style={{ color: C.dark, fontWeight: '800', textAlign: 'center' }}>KARNATAKA AGRICULTURE DEPARTMENT ↗</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <SectionTitle>IMPORTANT NOTE</SectionTitle>
        <Text style={styles.note}>This page is an information guide, not a government approval or live eligibility checker. Scheme rules, required documents, notified crops and application dates can change. Verify details on the official portal or at your nearest Raitha Samparka Kendra / agriculture office before applying. Never share OTPs or pay unofficial agents.</Text>
      </View>
    </>
  );

  const CropCalendarPage = () => (
    <>
      <PageHeading title={t.calendar} description={t.calendarDesc} />

      <View style={styles.panel}>
        <SectionTitle>🌧️ KHARIF SEASON</SectionTitle>
        <Text style={styles.panelTitle}>Main monsoon season • generally June–September</Text>
        <Text style={styles.listText}>Common crops: Paddy, ragi, maize, jowar, bajra, groundnut, soybean, tur/arhar and cotton.</Text>
        <Text style={styles.listText}>General guidance: Prepare the field before the expected monsoon, use locally recommended seed varieties and sow according to soil moisture and local advisories.</Text>
      </View>

      <View style={styles.panel}>
        <SectionTitle>❄️ RABI SEASON</SectionTitle>
        <Text style={styles.panelTitle}>Post-monsoon / winter season • generally October–January or later depending on crop</Text>
        <Text style={styles.listText}>Common crops in suitable areas: Bengal gram (chickpea), wheat, rabi jowar, safflower, mustard and some pulses.</Text>
        <Text style={styles.listText}>General guidance: Check residual soil moisture and irrigation availability. Follow the recommended sowing window for your district and crop variety.</Text>
      </View>

      <View style={styles.panel}>
        <SectionTitle>☀️ SUMMER SEASON</SectionTitle>
        <Text style={styles.panelTitle}>Generally January–March for sowing, with crop duration varying</Text>
        <Text style={styles.listText}>Possible crops where water is available: Summer paddy, groundnut, pulses and selected vegetables.</Text>
        <Text style={styles.listText}>General guidance: Confirm irrigation availability, choose suitable short-duration varieties and plan water use carefully.</Text>
      </View>

      <View style={styles.panel}>
        <SectionTitle>📍 CHECK YOUR LOCAL CROP CALENDAR</SectionTitle>
        <Text style={styles.listText}>Sowing dates are not the same across Karnataka. They change with district, taluk, rainfall, soil type, irrigation and crop variety. Check the local agricultural university or department advisory before sowing.</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://www.uasbangalore.edu.in/en/agrometerology/')} style={{ backgroundColor: C.green, padding: 12, borderRadius: 10, marginTop: 12 }}>
          <Text style={{ color: C.white, fontWeight: '800', textAlign: 'center' }}>OPEN UAS BENGALURU CROP WEATHER CALENDAR ↗</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://mausam.imd.gov.in/')} style={{ borderColor: C.green, borderWidth: 1, padding: 12, borderRadius: 10, marginTop: 8 }}>
          <Text style={{ color: C.dark, fontWeight: '800', textAlign: 'center' }}>OPEN IMD WEATHER ADVISORIES ↗</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <SectionTitle>IMPORTANT NOTE</SectionTitle>
        <Text style={styles.note}>This is a general seasonal guide, not a district-specific sowing recommendation. Always follow current local advisories from the agriculture department, Krishi Vigyan Kendra or agricultural university.</Text>
      </View>
    </>
  );

  const NotificationsPage = () => (
    <>
      <PageHeading
        title={t.notifications || 'Crop-Care Alerts'}
        description={t.notificationsDesc || 'Simple reminders to help you check your crops regularly.'}
      />
      <View style={styles.panel}>
        <SectionTitle>🔔 FARMER REMINDERS</SectionTitle>
        <Text style={styles.panelTitle}>💧 Check soil moisture before watering</Text>
        <Text style={styles.listText}>Check the soil near the root zone. Water only when the crop and soil conditions require it.</Text>
        <View style={{ height: 14 }} />
        <Text style={styles.panelTitle}>🌿 Inspect leaves and stems</Text>
        <Text style={styles.listText}>Look for unusual spots, yellowing, holes or insects. Early inspection can help you act sooner.</Text>
        <View style={{ height: 14 }} />
        <Text style={styles.panelTitle}>🌦️ Check the local weather advisory</Text>
        <Text style={styles.listText}>Review the latest forecast before irrigation, spraying or field operations.</Text>
        <TouchableOpacity onPress={() => setScreen('weather')} style={{ backgroundColor: C.green, padding: 12, borderRadius: 10, marginTop: 14 }}>
          <Text style={{ color: C.white, fontWeight: '800', textAlign: 'center' }}>OPEN WEATHER PAGE ↗</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.panel}>
        <SectionTitle>IMPORTANT NOTE</SectionTitle>
        <Text style={styles.note}>These are general in-app reminders. They are not personalised alerts, automatic weather warnings or phone push notifications. Check local agricultural and weather advisories for time-sensitive decisions.</Text>
      </View>
    </>
  );

  const renderPage = () => {
    switch (screen) {
      case 'detect': return <DetectPage />;
      case 'expert': return <ExpertPage />;
      case 'market': return <MarketPage />;
      case 'weather': return <WeatherPage />;
      case 'health': return <HealthPage />;
      case 'history': return <HistoryPage />;
      case 'pest': return <PestPage />;
      case 'soil': return <SoilPage />;
      case 'schemes': return <SchemesPage />;
      case 'calendar': return <CropCalendarPage />;
      case 'notifications': return <NotificationsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <View style={styles.app}>
      <StatusBar barStyle="dark-content" />
      <CyberBackground />

      {screen === 'splash' && (
        <View style={styles.centerScreen}>
          <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
            <Image
              source={LEAF_LOGIC_LOGO}
              style={styles.mainLogo}
              resizeMode="contain"
            />
            <Text style={styles.splashTitle}>LEAF LOGIC</Text>
            <Text style={styles.splashSubtitle}>
              NATURE'S LOGIC, SMARTER FUTURE
            </Text>
            <View style={styles.loadingTrack}>
              <View style={styles.loadingBar} />
            </View>
            <Text style={styles.loadingText}>INITIALIZING SYSTEM...</Text>
          </Animated.View>
        </View>
      )}

      {screen === 'welcome' && (
        <View style={styles.centerScreen}>
          <Animated.View
            style={{ opacity: fade, alignItems: 'center', width: '100%' }}
          >
            <Image
              source={LEAF_LOGIC_LOGO}
              style={styles.mainLogo}
              resizeMode="contain"
            />
            <Text style={styles.welcomeTitle}>{t.title}</Text>
            <Text style={styles.welcomeQuote}>{t.quote}</Text>
            <Text style={styles.panelText}>{t.subtitle}</Text>
            <Text style={styles.languageHeading}>{t.language}</Text>
            <LanguageSelector />
            <Button
              label={t.start}
              onPress={() => navigate('home')}
            />
            <Text style={styles.footerText}>{t.noLogin}</Text>
          </Animated.View>
        </View>
      )}

      {screen !== 'splash' && screen !== 'welcome' && (
        <View style={styles.mainScreen}>
          <Header />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { maxWidth: wide ? 1400 : 720 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {screen !== 'home' && <BackButton />}
            {renderPage()}
          </ScrollView>

          <View style={styles.bottomNav}>
            {[
              ['⌂', 'Home', 'home' as Screen],
              ['⌗', 'Detect', 'detect' as Screen],
              ['▥', 'Market', 'market' as Screen],
              ['☼', 'Weather', 'weather' as Screen],
              ['❧', 'Health', 'health' as Screen],
            ].map(([icon, label, id]) => (
              <TouchableOpacity
                key={id}
                style={styles.navItem}
                onPress={() => navigate(id as Screen)}
              >
                <Text style={[
                  styles.navIcon,
                  screen === id && styles.greenText,
                ]}>
                  {icon}
                </Text>
                <Text style={[
                  styles.navLabel,
                  screen === id && styles.greenText,
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mainLogo: {
    width: 210,
    height: 210,
    marginBottom: 18,
  },
  headerLogo: {
    width: 54,
    height: 54,
  },
  footerLogo: {
    width: 100,
    height: 100,
  },
  splashTitle: {
    color: C.dark,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },
  splashSubtitle: {
    color: C.green,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingTrack: {
    width: 220,
    height: 4,
    backgroundColor: C.light,
    marginTop: 35,
    borderRadius: 5,
    overflow: 'hidden',
  },
  loadingBar: {
    width: '75%',
    height: 4,
    backgroundColor: C.bright,
  },
  loadingText: {
    color: C.muted,
    fontSize: 9,
    letterSpacing: 3,
    marginTop: 14,
  },
  welcomeTitle: {
    color: C.dark,
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
  },
  welcomeQuote: {
    color: C.green,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 18,
  },
  languageHeading: {
    color: C.green,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 25,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 15,
  },
  languageButton: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  languageActive: {
    backgroundColor: '#E4F8EA',
    borderColor: C.green,
  },
  languageText: {
    color: C.text,
    fontSize: 11,
    fontWeight: '800',
  },
  button: {
    backgroundColor: '#009E45',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
    shadowColor: C.green,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  outlineButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: C.green,
  },
  greenText: {
    color: C.green,
  },
  mainScreen: {
    flex: 1,
  },
  header: {
    minHeight: 78,
    paddingHorizontal: 24,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    zIndex: 2,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTitle: {
    color: C.dark,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSubtitle: {
    color: C.green,
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 45,
  },
  hero: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1.5,
    borderColor: '#A6E8BA',
    borderRadius: 22,
    padding: 25,
    marginBottom: 22,
    elevation: 5,
  },
  heroContent: {
    flex: 1,
    minWidth: 260,
  },
  eyebrow: {
    color: C.green,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 13,
  },
  heroTitle: {
    color: C.dark,
    fontSize: 39,
    fontWeight: '900',
    lineHeight: 47,
  },
  heroDescription: {
    color: C.text,
    fontSize: 13,
    marginTop: 14,
    marginBottom: 22,
    lineHeight: 21,
  },
  scannerPanel: {
    width: 230,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F9EE',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#9CE4B2',
    padding: 12,
  },
  scannerBadge: {
    color: C.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  scannerFrame: {
    width: 165,
    height: 135,
    backgroundColor: '#075B32',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scannerLeaf: {
    fontSize: 75,
    zIndex: 1,
  },
  scannerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#7BFFAA',
    zIndex: 2,
    shadowColor: '#00FF73',
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  scannerCornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00FF73',
  },
  scannerCornerTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00FF73',
  },
  scannerCornerBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 22,
    height: 22,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00FF73',
  },
  scannerCornerBR: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 22,
    height: 22,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00FF73',
  },
  scannerStatus: {
    color: C.green,
    fontWeight: '900',
    fontSize: 10,
    marginTop: 10,
  },
  scannerTrack: {
    width: '85%',
    height: 6,
    backgroundColor: '#C8EED4',
    borderRadius: 5,
    marginTop: 8,
    overflow: 'hidden',
  },
  scannerProgress: {
    width: '65%',
    height: 6,
    backgroundColor: C.bright,
  },
  benefitList: {
    width: 175,
    gap: 9,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF9EE',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 11,
  },
  benefitIcon: {
    color: C.green,
    fontSize: 18,
  },
  benefitText: {
    color: C.dark,
    fontSize: 9,
    fontWeight: '900',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 25,
  },
  quickCard: {
    flex: 1,
    minWidth: 170,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },
  quickIcon: {
    color: C.green,
    fontSize: 32,
  },
  quickDivider: {
    width: 1,
    height: 42,
    backgroundColor: C.border,
  },
  quickNumber: {
    color: C.green,
    fontSize: 24,
    fontWeight: '900',
  },
  quickLabel: {
    color: C.dark,
    fontSize: 10,
    fontWeight: '900',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 18,
  },
  sectionLeaf: {
    color: C.green,
    fontSize: 29,
  },
  sectionTitle: {
    color: C.dark,
    fontSize: 15,
    fontWeight: '900',
    flexShrink: 1,
  },
  sectionLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: C.green,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
  },
  featureCard: {
    width: '100%',
    minHeight: 190,
    padding: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#9CE4B2',
    borderRadius: 17,
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 3,
  },
  wideFeatureCard: {
    width: '18%',
    minWidth: 180,
    flexGrow: 1,
  },
  featureIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#EAF9EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  featureIconText: {
    color: C.green,
    fontSize: 27,
  },
  featureTitle: {
    color: C.dark,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 7,
  },
  featureDescription: {
    color: C.text,
    fontSize: 12,
    lineHeight: 18,
  },
  explore: {
    color: C.green,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 15,
  },
  cardLeaf: {
    position: 'absolute',
    right: -4,
    bottom: -10,
    fontSize: 42,
    opacity: 0.16,
  },
  tipCard: {
    backgroundColor: '#E9F9EE',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 23,
    marginTop: 25,
  },
  tipTitle: {
    color: C.dark,
    fontSize: 17,
    fontWeight: '900',
  },
  tipText: {
    color: C.text,
    fontSize: 13,
    lineHeight: 22,
    marginTop: 10,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  footerTitle: {
    color: C.green,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 3,
  },
  footerText: {
    color: C.muted,
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 13,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    marginBottom: 22,
  },
  pageHeading: {
    marginBottom: 24,
  },
  pageTitle: {
    color: C.dark,
    fontSize: 29,
    fontWeight: '900',
    marginBottom: 10,
  },
  pageDescription: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 22,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 23,
    marginBottom: 18,
    elevation: 3,
  },
  bigIcon: {
    color: C.green,
    fontSize: 55,
    textAlign: 'center',
  },
  panelTitle: {
    color: C.dark,
    fontSize: 18,
    fontWeight: '900',
    marginVertical: 13,
    textAlign: 'center',
  },
  panelText: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
  },
  uploadFrame: {
    width: '100%',
    minHeight: 220,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.green,
    borderRadius: 15,
    backgroundColor: '#F0FBF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 23,
  },
  uploadLeaf: {
    fontSize: 70,
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  changeImageButton: {
    marginTop: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.green,
    backgroundColor: '#FFFFFF',
  },
  changeImageText: {
    color: C.green,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  uploadButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  mutedText: {
    color: C.muted,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 7,
  },
  listText: {
    color: C.text,
    fontSize: 13,
    lineHeight: 24,
    marginVertical: 5,
  },
  note: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 17,
    marginTop: 16,
  },
  messageInput: {
    minHeight: 115,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 11,
    padding: 15,
    color: C.text,
    backgroundColor: '#F8FFF9',
    textAlignVertical: 'top',
    marginVertical: 20,
  },
  marketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  marketCrop: {
    color: C.dark,
    fontSize: 14,
    fontWeight: '800',
  },
  marketPrice: {
    color: C.green,
    fontSize: 12,
    fontWeight: '900',
  },
  weatherMain: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 17,
    backgroundColor: '#E9F9EE',
    borderWidth: 1,
    borderColor: C.border,
  },
  weatherIcon: {
    color: C.green,
    fontSize: 65,
  },
  weatherTemp: {
    color: C.dark,
    fontSize: 48,
    fontWeight: '900',
  },
  weatherLocation: {
    color: C.green,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 15,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 17,
  },
  weatherCard: {
    flex: 1,
    minWidth: 135,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    padding: 18,
    alignItems: 'center',
  },
  weatherValue: {
    color: C.dark,
    fontSize: 19,
    fontWeight: '900',
  },
  weatherLabel: {
    color: C.muted,
    fontSize: 11,
    marginTop: 8,
  },
  cropOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    marginVertical: 5,
  },
  cropSelected: {
    backgroundColor: '#E8F8ED',
    borderColor: C.green,
  },
  cropText: {
    color: C.dark,
    fontSize: 14,
    fontWeight: '700',
  },
  bottomNav: {
    minHeight: 68,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 5,
    zIndex: 2,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },
  navIcon: {
    color: C.muted,
    fontSize: 22,
  },
  navLabel: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
});
