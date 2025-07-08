# Responsive Cross-Platform Mobile App

A React Native app built with Expo that demonstrates responsive design principles, adapting to different screen sizes, orientations, and device types.

## Features

- **Cross-Platform**: Works on iOS, Android, and Web
- **Responsive Design**: Adapts to different screen sizes and orientations
- **Orientation Support**: Handles portrait and landscape modes
- **Device Detection**: Optimized for phones and tablets
- **TypeScript**: Full type safety
- **Modern UI**: Clean, accessible design

## Project Structure

```
├── components/           # Reusable UI components
│   ├── ResponsiveContainer.tsx
│   └── ResponsiveCard.tsx
├── screens/             # App screens
│   └── HomeScreen.tsx
├── hooks/               # Custom React hooks
│   └── useResponsive.ts
├── constants/           # App constants and themes
│   └── theme.ts
├── utils/               # Utility functions
├── assets/              # Images and static assets
└── App.tsx              # Main app component
```

## Key Components

### ResponsiveContainer
A wrapper component that adapts layout based on screen orientation and device type.

### ResponsiveCard
A card component with different variants (default, elevated, outlined) that adjusts padding and styling based on screen size.

### useResponsive Hook
Custom hook that provides:
- Screen dimensions (width, height)
- Orientation (portrait/landscape)
- Device type (phone/tablet)
- Responsive state helpers

## Responsive Design Features

### Screen Size Adaptation
- **Phone**: Compact layout with smaller fonts and spacing
- **Tablet**: Larger layout with increased padding and font sizes
- **Desktop**: Maximum spacing and typography

### Orientation Handling
- **Portrait**: Vertical layout with stacked components
- **Landscape**: Horizontal layout with side-by-side components

### Breakpoints
- Phone: < 480px
- Tablet: 480px - 768px
- Desktop: > 768px

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Installation
```bash
npm install
```

### Running the App

#### iOS Simulator
```bash
npm run ios
```

#### Android Emulator
```bash
npm run android
```

#### Web Browser
```bash
npm run web
```

#### Development Build
```bash
npx expo start
```

## Development

### Adding New Screens
1. Create a new file in `screens/`
2. Import and use the `useResponsive` hook
3. Use `ResponsiveContainer` and `ResponsiveCard` components
4. Apply responsive styles using the theme constants

### Customizing Theme
Edit `constants/theme.ts` to modify:
- Colors
- Spacing
- Typography
- Breakpoints
- Layout constants

### Adding Responsive Components
1. Create component in `components/`
2. Import `useResponsive` hook
3. Use theme constants for consistent styling
4. Test on different screen sizes and orientations

## Dependencies

- **React Native**: Core framework
- **Expo**: Development platform
- **expo-screen-orientation**: Orientation detection
- **expo-device**: Device type detection
- **react-native-safe-area-context**: Safe area handling

## Best Practices

1. **Always use the `useResponsive` hook** for responsive logic
2. **Use theme constants** for consistent styling
3. **Test on multiple devices** and orientations
4. **Use flexbox** for flexible layouts
5. **Consider accessibility** in responsive design

## Platform Support

- ✅ iOS (iPhone, iPad)
- ✅ Android (Phone, Tablet)
- ✅ Web (Desktop, Mobile browsers)

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Test on multiple screen sizes
4. Update documentation for new features 