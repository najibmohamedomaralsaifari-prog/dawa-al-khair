import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const WEATHER_CODES = {
  0: { label: 'سماء صافية', icon: '☀️' },
  1: { label: 'صحو غالبًا', icon: '🌤️' },
  2: { label: 'غائم جزئيًا', icon: '⛅' },
  3: { label: 'غائم', icon: '☁️' },
  45: { label: 'ضباب', icon: '🌫️' },
  48: { label: 'ضباب متجمد', icon: '🌫️' },
  51: { label: 'رذاذ خفيف', icon: '🌦️' },
  53: { label: 'رذاذ', icon: '🌦️' },
  55: { label: 'رذاذ كثيف', icon: '🌧️' },
  56: { label: 'رذاذ متجمد خفيف', icon: '🌧️' },
  57: { label: 'رذاذ متجمد كثيف', icon: '🌧️' },
  61: { label: 'مطر خفيف', icon: '🌧️' },
  63: { label: 'مطر', icon: '🌧️' },
  65: { label: 'مطر غزير', icon: '🌧️' },
  66: { label: 'مطر متجمد خفيف', icon: '🌧️' },
  67: { label: 'مطر متجمد غزير', icon: '🌧️' },
  71: { label: 'ثلوج خفيفة', icon: '🌨️' },
  73: { label: 'ثلوج', icon: '🌨️' },
  75: { label: 'ثلوج كثيفة', icon: '❄️' },
  77: { label: 'حبيبات ثلجية', icon: '❄️' },
  80: { label: 'زخات مطر خفيفة', icon: '🌦️' },
  81: { label: 'زخات مطر', icon: '🌧️' },
  82: { label: 'زخات مطر غزيرة', icon: '⛈️' },
  85: { label: 'زخات ثلجية', icon: '🌨️' },
  86: { label: 'زخات ثلجية كثيفة', icon: '❄️' },
  95: { label: 'عاصفة رعدية', icon: '⛈️' },
  96: { label: 'عاصفة رعدية مع بَرَد', icon: '⛈️' },
  99: { label: 'عاصفة رعدية قوية', icon: '⛈️' },
};

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { label: 'حالة جوية غير معروفة', icon: '🌡️' };
}

function formatDay(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('ar', {
    weekday: 'short',
  });
}

export default function App() {
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const searchWeather = async (city) => {
    const trimmedCity = city.trim();
    if (!trimmedCity) {
      setError('اكتب اسم مدينة للبحث عن حالة الطقس.');
      return;
    }

    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError('');

    try {
      const geoUrl =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmedCity)}` +
        '&count=1&language=ar&format=json';
      const geoResponse = await fetch(geoUrl);

      if (!geoResponse.ok) {
        throw new Error('تعذر البحث عن المدينة. حاول مرة أخرى.');
      }

      const geoData = await geoResponse.json();
      const place = geoData.results?.[0];

      if (!place) {
        throw new Error('لم نعثر على هذه المدينة. تحقق من الاسم وحاول مجددًا.');
      }

      const weatherUrl =
        'https://api.open-meteo.com/v1/forecast' +
        `?latitude=${place.latitude}&longitude=${place.longitude}` +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
        '&forecast_days=5&timezone=auto';

      const weatherResponse = await fetch(weatherUrl);

      if (!weatherResponse.ok) {
        throw new Error('تعذر جلب بيانات الطقس. حاول مرة أخرى.');
      }

      const weatherData = await weatherResponse.json();

      if (currentRequestId === requestId.current) {
        setWeather(weatherData);
        setLocationName(
          [place.name, place.admin1, place.country].filter(Boolean).join('، '),
        );
      }
    } catch (err) {
      if (currentRequestId === requestId.current) {
        setError(err.message || 'حدث خطأ أثناء جلب بيانات الطقس.');
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    searchWeather('Al Ghaydah');
  }, []);

  const current = weather?.current;
  const currentInfo = current ? getWeatherInfo(current.weather_code) : null;
  const daily = weather?.daily;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102A43" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.appTitle}>الطقس</Text>
        <Text style={styles.subtitle}>تابع حالة الطقس في مدينتك</Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث عن مدينة..."
            placeholderTextColor="#829AB1"
            textAlign="right"
            returnKeyType="search"
            onSubmitEditing={() => searchWeather(query)}
            accessibilityLabel="اسم المدينة"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => searchWeather(query)}
            accessibilityRole="button"
          >
            <Text style={styles.searchButtonText}>بحث</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.messageBox}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.messageText}>جارٍ تحميل الطقس...</Text>
          </View>
        )}

        {!loading && error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!loading && current && daily && (
          <>
            <View style={styles.currentCard}>
              <Text style={styles.location}>📍 {locationName}</Text>
              <Text style={styles.currentIcon}>{currentInfo.icon}</Text>
              <Text style={styles.temperature}>
                {Math.round(current.temperature_2m)}°
              </Text>
              <Text style={styles.condition}>{currentInfo.label}</Text>
              <Text style={styles.feelsLike}>
                المحسوسة {Math.round(current.apparent_temperature)}°
              </Text>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>💧</Text>
                  <Text style={styles.detailValue}>
                    {current.relative_humidity_2m}%
                  </Text>
                  <Text style={styles.detailLabel}>الرطوبة</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>💨</Text>
                  <Text style={styles.detailValue}>
                    {Math.round(current.wind_speed_10m)} كم/س
                  </Text>
                  <Text style={styles.detailLabel}>الرياح</Text>
                </View>
              </View>
            </View>

            <View style={styles.forecastCard}>
              <Text style={styles.sectionTitle}>توقعات الأيام القادمة</Text>

              {daily.time.map((date, index) => {
                const info = getWeatherInfo(daily.weather_code[index]);

                return (
                  <View key={date} style={styles.forecastRow}>
                    <Text style={styles.forecastDay}>
                      {index === 0 ? 'اليوم' : formatDay(date)}
                    </Text>
                    <Text style={styles.forecastIcon}>{info.icon}</Text>
                    <Text style={styles.forecastCondition}>{info.label}</Text>
                    <Text style={styles.forecastRain}>
                      💧 {daily.precipitation_probability_max[index] ?? 0}%
                    </Text>
                    <Text style={styles.forecastTemps}>
                      {Math.round(daily.temperature_2m_max[index])}° /{' '}
                      {Math.round(daily.temperature_2m_min[index])}°
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.attribution}>
              بيانات الطقس مقدمة من Open-Meteo
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102A43',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    color: '#BCCCDC',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 22,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    color: '#102A43',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    marginRight: 8,
  },
  searchButton: {
    minWidth: 68,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  currentCard: {
    backgroundColor: '#1E3A56',
    borderRadius: 22,
    alignItems: 'center',
    padding: 22,
    marginBottom: 18,
  },
  location: {
    color: '#E0F2FE',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  currentIcon: {
    fontSize: 58,
    marginTop: 12,
  },
  temperature: {
    color: '#FFFFFF',
    fontSize: 68,
    fontWeight: '200',
    lineHeight: 82,
  },
  condition: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '600',
  },
  feelsLike: {
    color: '#BCCCDC',
    fontSize: 14,
    marginTop: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#486581',
    marginTop: 22,
    paddingTop: 16,
  },
  detailItem: {
    alignItems: 'center',
    minWidth: 110,
  },
  detailIcon: {
    fontSize: 20,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 4,
  },
  detailLabel: {
    color: '#BCCCDC',
    fontSize: 12,
    marginTop: 3,
  },
  forecastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
  },
  sectionTitle: {
    color: '#102A43',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 12,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: '#E6EDF2',
  },
  forecastDay: {
    color: '#102A43',
    fontSize: 13,
    fontWeight: 'bold',
    width: 48,
    textAlign: 'right',
  },
  forecastIcon: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  forecastCondition: {
    color: '#486581',
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
    marginHorizontal: 4,
  },
  forecastRain: {
    color: '#0284C7',
    fontSize: 11,
    marginHorizontal: 5,
  },
  forecastTemps: {
    color: '#102A43',
    fontSize: 12,
    fontWeight: '600',
  },
  messageBox: {
    alignItems: 'center',
    padding: 28,
  },
  messageText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 15,
  },
  errorBox: {
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'right',
    lineHeight: 22,
  },
  attribution: {
    color: '#9FB3C8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 18,
  },
});