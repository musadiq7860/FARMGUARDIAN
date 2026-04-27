# FarmGuardian - React Native Mobile App

A comprehensive AI-powered agricultural decision support system for farmers in Punjab, Pakistan.

## 🌾 Overview

FarmGuardian is a mobile application designed to help farmers with:
- **Disease Detection**: Upload crop leaf images for AI-based disease identification
- **Yield Prediction**: Predict crop yields based on soil, weather, and farming practices
- **Soil & Resource Advisory**: Get irrigation and fertilizer recommendations
- **GeoSpatial Mapping**: Mark farm locations and get region-specific advice
- **Reports & History**: Track all detections and predictions over time

## 🚀 Features

### Core Modules
1. **Authentication**
   - Phone number + OTP login
   - Guest mode for first-time users
   - Simple registration process

2. **Disease Detection**
   - Camera/gallery image picker
   - AI-powered disease classification
   - Traffic-light status system (Green/Yellow/Red)
   - Recommendations in Urdu

3. **Yield Prediction**
   - Input-based prediction (crop type, soil, area, etc.)
   - Comparison with regional averages
   - Confidence level indicators

4. **Soil & Resource Advisory**
   - Irrigation schedules
   - Fertilizer recommendations
   - Pest control tips

5. **GeoSpatial Mapping**
   - Interactive map with react-native-maps
   - Farm location marking
   - Soil suitability zones

6. **Reports & History**
   - View past detections and predictions
   - Export and share reports

7. **Admin Panel**
   - View registered farmers
   - System statistics
   - Content management

### Technical Features
- **Urdu Language Support**: Full RTL support with Urdu translations
- **Offline Mode**: Local data caching and request queuing
- **Accessibility**: Large icons, high contrast, voice support ready
- **Mock API**: Built-in mock responses for development

## 📱 Supported Crops

The app supports **5 crops** only:
- 🌽 Maize (مکئی)
- 🌾 Wheat (گندم)
- 🍚 Rice (چاول)
- 🥔 Potato (آلو)
- 🍅 Tomato (ٹماٹر)

## 🛠️ Tech Stack

- **React Native** 0.72+
- **React Navigation** (Bottom Tabs + Stack)
- **React Context API** (State management)
- **react-native-paper** (UI components)
- **react-i18next** (Urdu/English localization)
- **react-native-image-picker** (Camera integration)
- **react-native-maps** (Mapping)
- **AsyncStorage** (Local storage)
- **Axios** (API calls)

## 📦 Installation

```bash
# Clone the repository
cd App

# Install dependencies
npm install

# iOS specific (macOS only)
cd ios && pod install && cd ..

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 🔧 Configuration

### API Configuration
Edit `src/utils/constants.js` to configure API endpoints:

```javascript
export const API_BASE_URL = 'https://your-api-url.com';
```

### Mock Mode
To enable/disable mock API responses, edit service files:
- `src/services/authService.js`
- `src/services/diseaseService.js`
- `src/services/yieldService.js`
- `src/services/advisoryService.js`

Set `MOCK_MODE = false` to use real APIs.

## 📂 Project Structure

```
App/
├── src/
│   ├── components/        # Reusable UI components
│   ├── context/          # Auth & Language contexts
│   ├── hooks/            # Custom hooks (offline sync)
│   ├── locales/          # i18n translations (ur.json, en.json)
│   ├── navigation/       # Navigation setup
│   ├── screens/          # All screen components
│   ├── services/         # API services
│   └── utils/            # Constants, helpers, storage
├── android/              # Android native code
├── ios/                  # iOS native code
├── package.json
└── README.md
```

## 🌍 Localization

The app supports Urdu (primary) and English (fallback). All farmer-facing content is in Urdu with RTL support.

To add/edit translations:
- Edit `src/locales/ur.json` for Urdu
- Edit `src/locales/en.json` for English

## 🔐 Admin Access

Admin panel credentials (mock mode):
- Username: `admin`
- Password: `admin123`

## 📸 Screenshots

(Add screenshots here after testing on device)

## 🧪 Testing

```bash
# Run tests
npm test

# Run linter
npm run lint
```

## 📱 Permissions Required

- **Camera**: For taking crop leaf photos
- **Location**: For geospatial mapping features
- **Storage**: For saving images locally

## 🚧 Development Notes

### Mock API Responses
All services include mock implementations for development. The app works fully without a backend API.

### Offline Support
- Detections and predictions are cached locally
- Pending requests are queued when offline
- Auto-sync when connection is restored

### RTL Support
The app automatically switches to RTL layout when Urdu is selected. No manual configuration needed.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.....

## 👥 Team

Musadiq Qaysir @musadiq7860
Faraz Shoukat @farazshoukat
Abdullah Arshad @AbdullahArshad21


## 📞 Support

For issues or questions, contact the development team.

---

**Note**: This is a production-ready application with mock APIs. Connect to real backend services for full functionality.

