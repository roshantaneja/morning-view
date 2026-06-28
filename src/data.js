import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, '..', 'config.json');

function loadConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function buildDateInfo() {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const month = now.getMonth();
  const seasons = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer',
    'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now - startOfYear;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const startOfWeek = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((now - startOfWeek) / (1000 * 60 * 60 * 24) + startOfWeek.getDay() + 1) / 7);
  const isLeap = (y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)(now.getFullYear());

  return {
    formatted: `${dayNames[now.getDay()]}, ${monthNames[month]} ${now.getDate()}, ${now.getFullYear()}`,
    year: now.getFullYear(),
    month: month + 1,
    day: now.getDate(),
    dayOfWeek: dayNames[now.getDay()],
    dayOfYear,
    season: seasons[month],
    daysInYear: isLeap ? 366 : 365,
    weekNumber,
  };
}

const WMO_CODES = {
  0: 'clear', 1: 'mostly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'fog', 48: 'rime fog',
  51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle',
  61: 'light rain', 63: 'rain', 65: 'heavy rain',
  71: 'light snow', 73: 'snow', 75: 'heavy snow',
  80: 'light showers', 81: 'showers', 82: 'heavy showers',
  95: 'thunderstorm', 96: 'thunderstorm with hail', 99: 'severe thunderstorm',
};

async function fetchWeather(config) {
  const { latitude, longitude } = config.location || {};
  if (!latitude || !longitude) return null;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const current = data.current;
    return {
      temp: Math.round(current.temperature_2m),
      condition: WMO_CODES[current.weather_code] || 'unknown',
      weatherCode: current.weather_code,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
    };
  } catch {
    return null;
  }
}

async function fetchOnThisDay() {
  try {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'MorningView/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    const events = data.events || [];
    if (events.length === 0) return null;
    const event = events[Math.floor(Math.random() * events.length)];
    return `In ${event.year}, ${event.text}`;
  } catch {
    return null;
  }
}

async function fetchRandomFact() {
  try {
    const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
    if (!res.ok) return null;
    const data = await res.json();
    return data.text || null;
  } catch {
    return null;
  }
}

export async function fetchDataBundle() {
  const config = loadConfig();

  const [weather, onThisDay, randomFact] = await Promise.all([
    fetchWeather(config),
    fetchOnThisDay(),
    fetchRandomFact(),
  ]);

  return {
    weather,
    date: buildDateInfo(),
    facts: {
      onThisDay,
      randomFact,
    },
    config,
  };
}
