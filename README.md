# 2468 Scorekeeper App for 2 and 3 players

## Game Description: 2468

2468 is a strategic poker variant designed for two or three players. Each player is initially dealt 12 cards.

Players must divide their 12 cards into four distinct hands:
	1.	First Hold’em Hand
	2.	Second Hold’em Hand (must be stronger than the first)
	3.	First Omaha Hand (high-only)
	4.	Second Omaha Hand (high/low split)

All four hands share the same set of community cards: a standard flop, turn, and river. No separate boards are dealt.
	•	Hold’em Hands follow standard Texas Hold’em rules. Players use none, one or two hole cards and three, four or five community cards.
	•	Omaha Hands follow standard Omaha rules. Players must use exactly two of their four hole cards and three community cards.

Scoring and Units

Each hand is played and scored separately, with the following unit values:
	•	First Hold’em Hand: 2 units
	•	Second Hold’em Hand (must beat the first): 4 units
	•	First Omaha Hand (High Only): 6 units
	•	Second Omaha Hand (High/Low Split): 8 units total
	•	4 units for the high hand
	•	4 units for the qualifying low hand (if applicable — pot may be split)

At the end of the round, players reveal their hands and compare each type head-to-head to determine the outcome of each unit category.


# Responsive Cross-Platform Mobile App

This scorekeeper is a React Native app built with Expo that demonstrates responsive design principles, adapting to different screen sizes, orientations, and device types.

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