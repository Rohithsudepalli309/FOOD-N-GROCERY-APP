// Server connection config — update SERVER_IP to your PC's local IP when testing on device
// Android Emulator: 10.0.2.2 | iOS Simulator: localhost | Real device: your PC's 192.168.x.x IP
export const SERVER_IP = '10.0.2.2';
export const SERVER_PORT = 3001;
export const SERVER_URL = `http://${SERVER_IP}:${SERVER_PORT}`;
export const WS_URL = `ws://${SERVER_IP}:${SERVER_PORT}`;

export const GOOGLE_MAPS_API_KEY = 'AIzaSyYourGoogleMapsKeyHere'; // Replace for live Maps

export const RAZORPAY_KEY = 'rzp_test_YourKeyHere'; // Get free test key at razorpay.com

export const SURGE_REFRESH_MS = 60000;   // Re-check surge every 60s
export const RIDER_GPS_INTERVAL_MS = 3000; // Rider location update frequency
export const SEARCH_DEBOUNCE_MS = 300;   // Search debounce delay
