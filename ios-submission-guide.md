# iOS App Store Submission Guide using EAS

## Prerequisites

### 1. Apple Developer Account
- **Cost**: $99/year
- **Sign up**: [developer.apple.com](https://developer.apple.com)
- **Required**: Valid Apple ID and payment method
- **Processing time**: Usually instant, but can take up to 24 hours

### 2. Required Tools
- **EAS CLI**: For building and submitting
- **Expo CLI**: For project management
- **Xcode** (optional but recommended): For testing and troubleshooting

### 3. Install Required Tools
```bash
# Install EAS CLI globally
npm install -g @expo/eas-cli

# Install Expo CLI (if not already installed)
npm install -g @expo/cli

# Login to your Expo account
eas login
```

---

## Step 1: Configure Your App for Production

### 1.1 Update app.json/app.config.js
```json
{
  "expo": {
    "name": "2468 Scorekeeper (Lite)",
    "slug": "2468-scorekeeper-lite",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.erikwagner.2468scorekeeperLite",
      "buildNumber": "1",
      "icon": "./assets/icon.png"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

### 1.2 Key Configuration Points
- **bundleIdentifier**: Must be unique (e.g., `com.erikwagner.2468scorekeeperLite`)
- **version**: Semantic version for App Store (e.g., "1.0.0")
- **buildNumber**: Integer that increases with each build (e.g., "1", "2", "3")
- **icon**: 1024x1024px PNG file
- **supportsTablet**: Set to true since your app works on iPad

---

## Step 2: Initialize EAS in Your Project

### 2.1 Initialize EAS
```bash
# Navigate to your project directory
cd /path/to/your/2468_counter

# Initialize EAS
eas init
```

### 2.2 Configure EAS Build
This creates an `eas.json` file:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "erikwagner77@gmail.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

---

## Step 3: Create App in App Store Connect

### 3.1 Access App Store Connect
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Sign in with your Apple Developer account
3. Click "My Apps"
4. Click the "+" button and select "New App"

### 3.2 Create New App
Fill out the form:
- **Platform**: iOS
- **Name**: 2468 Scorekeeper (Lite)
- **Primary Language**: English (US)
- **Bundle ID**: Select the bundle ID you configured (com.erikwagner.2468scorekeeperLite)
- **SKU**: Unique identifier (e.g., "2468-scorekeeper-lite-001")

### 3.3 Note Your App ID
- After creation, note the **App Store Connect App ID** (found in App Information)
- You'll need this for the EAS configuration

---

## Step 4: Build Your App with EAS

### 4.1 Create Production Build
```bash
# Build for iOS App Store
eas build --platform ios --profile production
```

### 4.2 Build Process
- EAS will handle code signing automatically
- Build typically takes 5-15 minutes
- You'll get a download link when complete
- The build will be automatically uploaded to App Store Connect

### 4.3 Monitor Build Progress
- Check build status at [expo.dev](https://expo.dev)
- You'll receive email notifications about build status
- Logs are available if the build fails

---

## Step 5: Configure App Store Connect Listing

### 5.1 App Information
Navigate to your app in App Store Connect:
- **App Information** → **General Information**
- **Category**: Games
- **Secondary Category**: Entertainment
- **Content Rights**: Check if you own or have licensed all content

### 5.2 Pricing and Availability
- **Price**: Free
- **Availability**: All countries/regions (or select specific ones)
- **App Store Distribution**: Available

### 5.3 App Privacy
- **Privacy Policy URL**: Host your privacy-policy.md and enter the URL
- **Privacy Practices**: 
  - Data Collection: "No, this app does not collect data"
  - Complete the privacy questionnaire (all "No" answers based on your app)

---

## Step 6: Create App Store Listing

### 6.1 Version Information
Go to **App Store** → **iOS App** → **1.0 Prepare for Submission**:

- **Description**: Use the long description from app-description.md
- **Keywords**: Use keywords from app-description.md (100 characters max)
- **Support URL**: Your website or GitHub repo
- **Marketing URL**: (optional) Your app's marketing page

### 6.2 App Review Information
- **Sign-in Required**: No
- **Age Rating**: 4+ (based on content-rating-guide.md)
- **Review Notes**: 
  ```
  This is a simple scorekeeper app for the 2468 card game. 
  No special instructions needed - the app is fully functional 
  without any setup or account creation.
  ```

### 6.3 Version Release
- **Automatically release**: Recommended for first release
- **Manual release**: Choose if you want to control release timing

---

## Step 7: Upload Screenshots and Assets

### 7.1 Required Screenshots
Upload screenshots for:
- **6.7" Display** (iPhone 14 Pro Max): 1290×2796px
- **6.5" Display** (iPhone 11 Pro Max): 1242×2688px  
- **5.5" Display** (iPhone 8 Plus): 1242×2208px
- **12.9" iPad Pro**: 2048×2732px (if supporting iPad)

### 7.2 Screenshot Tips
- Take screenshots of your actual app
- Show key features: main game screen, player setup, game history
- Use realistic player names and scores
- Follow the guidelines in store-assets-requirements.md

### 7.3 App Preview (Optional)
- 30-second video preview
- Shows app in action
- Can significantly improve conversion rates

---

## Step 8: Submit for Review

### 8.1 Final Checklist
Before submitting:
- [ ] Build uploaded successfully
- [ ] All required screenshots uploaded
- [ ] App description completed
- [ ] Privacy policy URL working
- [ ] Age rating set to 4+
- [ ] Pricing set to Free
- [ ] Keywords optimized
- [ ] Support URL provided

### 8.2 Submit for Review
1. Click "Add for Review" in App Store Connect
2. Review all information one final time
3. Click "Submit for Review"
4. You'll receive confirmation email

### 8.3 Review Process
- **Timeline**: Typically 24-48 hours
- **Status**: Monitor in App Store Connect
- **Possible outcomes**:
  - **Approved**: App goes live automatically (or when you release it)
  - **Rejected**: Review feedback and resubmit
  - **Metadata Rejected**: Fix listing issues and resubmit

---

## Step 9: Handle Review Feedback (if needed)

### 9.1 Common Rejection Reasons
- **Metadata**: Description doesn't match functionality
- **Screenshots**: Don't show actual app content
- **Privacy**: Privacy policy issues
- **Functionality**: App crashes or doesn't work as expected

### 9.2 Resubmission Process
If rejected:
1. Read the rejection message carefully
2. Fix the identified issues
3. If code changes needed: `eas build --platform ios --profile production`
4. If only metadata changes: Update in App Store Connect
5. Click "Submit for Review" again

---

## Step 10: Post-Approval Actions

### 10.1 App Goes Live
- You'll receive approval notification
- App appears in App Store within 24 hours
- Share the App Store link with users

### 10.2 Monitor Performance
- Check App Store Connect for:
  - Download numbers
  - User ratings and reviews
  - Crash reports
  - Revenue (if applicable)

### 10.3 Updates
For future updates:
1. Update version in app.json (e.g., "1.0.1")
2. Increment buildNumber (e.g., "2")
3. Run `eas build --platform ios --profile production`
4. Create new version in App Store Connect
5. Submit for review

---

## Troubleshooting Common Issues

### Build Failures
```bash
# Clear EAS cache
eas build --clear-cache

# Check build logs
eas build:list
```

### Code Signing Issues
- EAS handles this automatically
- If issues persist, check Apple Developer account status
- Ensure bundle identifier matches exactly

### App Store Connect Issues
- Bundle identifier must match exactly
- Version numbers must be unique
- Build numbers must increment

---

## Useful Commands

```bash
# Check build status
eas build:list

# View build details
eas build:view [build-id]

# Submit to App Store (alternative to automatic submission)
eas submit --platform ios

# Check project status
eas project:info

# Update EAS CLI
npm install -g @expo/eas-cli@latest
```

---

## Timeline Expectations

- **Setup**: 1-2 hours (first time)
- **Build**: 10-15 minutes
- **App Store Connect setup**: 30-60 minutes
- **Review process**: 24-48 hours
- **Total time to live**: 2-4 days

---

## Support Resources

- **EAS Documentation**: [docs.expo.dev/eas](https://docs.expo.dev/eas/)
- **App Store Connect Help**: [help.apple.com/app-store-connect](https://help.apple.com/app-store-connect/)
- **Expo Discord**: [chat.expo.dev](https://chat.expo.dev)
- **Apple Developer Forums**: [developer.apple.com/forums](https://developer.apple.com/forums/)

---

This guide should walk you through the entire process of getting your 2468 Scorekeeper app live on the iOS App Store using EAS! 