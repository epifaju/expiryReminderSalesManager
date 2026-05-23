import { Platform } from 'react-native';

/** PC LAN IP — must match `ipconfig` (Wi‑Fi). Override with EXPO_PUBLIC_API_HOST. */
const LAN_HOST = process.env.EXPO_PUBLIC_API_HOST ?? '192.168.1.17';

/** H2/test profile uses 8083; PostgreSQL/default profile uses 8082. */
export const getApiUrls = (): string[] => {
  if (Platform.OS === 'web') {
    return [
      'http://localhost:8083',
      'http://localhost:8082',
    ];
  }

  return [
    `http://${LAN_HOST}:8083`,
    `http://${LAN_HOST}:8082`,
    'http://10.0.2.2:8083',
    'http://10.0.2.2:8082',
    'http://localhost:8083',
    'http://localhost:8082',
    'http://127.0.0.1:8083',
    'http://127.0.0.1:8082',
  ];
};
