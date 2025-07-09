# OTA Updates Setup Guide

This project is configured with **Over-The-Air (OTA) updates** using EAS Update and GitHub Actions for automated deployment.

## How it works

### Automatic Updates
- **Pull Requests**: Creates preview builds for testing
- **Main Branch**: Creates production builds AND deploys OTA updates
- **OTA Updates**: JavaScript/React Native changes are pushed instantly to users
- **Full Builds**: Native changes trigger new app store builds

### Update Channels
- `development`: For development builds
- `preview`: For PR preview builds  
- `production`: For production app store builds

## Setup Instructions

### 1. GitHub Secrets Configuration
Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### Required:
- `EXPO_TOKEN`: Your Expo access token
  - Get it from: https://expo.dev/accounts/[username]/settings/access-tokens
  - Create a new token with appropriate permissions

#### Optional (for automatic app store submission):
- `APPLE_ID`: Your Apple Developer account email
- `APPLE_ID_PASSWORD`: App-specific password for Apple ID
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Google Play service account JSON key

### 2. EAS Project Setup
```bash
# Already configured in this project
eas update:configure
```

### 3. Test the Setup
```bash
# Test OTA update locally
eas update --branch preview --message "Test update"

# Test production build
eas build --platform all --profile production
```

## Usage

### For Developers
1. **Create PR**: Triggers preview build automatically
2. **Merge to main**: Triggers production build + OTA update
3. **Users get updates**: Automatically on next app launch

### For Users
- **JavaScript changes**: Update automatically (no app store)
- **Native changes**: Require app store update
- **Update check**: Happens on app launch

## Monitoring

- **Build Status**: Check GitHub Actions tab
- **Update Status**: Check EAS dashboard at https://expo.dev
- **User Analytics**: Available in EAS dashboard

## Troubleshooting

### Common Issues:
1. **Build fails**: Check GitHub Actions logs
2. **Update not received**: Check EAS dashboard for channel status
3. **Token expired**: Regenerate EXPO_TOKEN in GitHub secrets

### Manual Commands:
```bash
# Force update check
eas update --branch production --message "Manual update"

# Check update status
eas update:list --branch production

# Build without automation
eas build --platform all --profile production
```

## Benefits

✅ **Instant updates** for bug fixes and features  
✅ **Automatic deployment** on code changes  
✅ **Preview builds** for testing PRs  
✅ **No manual intervention** required  
✅ **Rollback capability** through EAS dashboard 