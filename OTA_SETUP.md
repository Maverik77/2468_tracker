# OTA Updates Setup Guide

This project is configured with **Over-The-Air (OTA) updates** using EAS Update and GitHub Actions for automated deployment.

## How it works

### Automatic Updates (Fast & Reliable)
- **Pull Requests**: Creates OTA preview updates (~2-3 minutes)
- **Main Branch**: Deploys production OTA updates (~2-3 minutes) 
- **OTA Updates**: JavaScript/React Native changes are pushed instantly to users
- **Full Builds**: Created manually when needed for native changes

### Update Channels
- `preview`: For PR preview updates  
- `production`: For production app store builds

## Setup Instructions

### 1. GitHub Secrets Configuration
Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### Required:
- `EXPO_TOKEN`: Your Expo access token
  - Get it from: https://expo.dev/accounts/[username]/settings/access-tokens
  - Create a new token with appropriate permissions

### 2. EAS Project Setup
```bash
# Already configured in this project
eas update:configure
```

### 3. Test the Setup
```bash
# Test OTA update locally
eas update --branch preview --message "Test update"

# Create builds manually when needed
eas build --platform all --profile production
```

## Usage

### For Developers
1. **Create PR**: Triggers preview OTA update automatically (~2-3 minutes)
2. **Merge to main**: Triggers production OTA update (~2-3 minutes)
3. **Users get updates**: Automatically on next app launch

### For Users
- **JavaScript changes**: Update automatically (no app store)
- **Native changes**: Require manual build + app store update
- **Update check**: Happens on app launch

### When to Create Builds
Create full builds manually only when you:
- Add new native dependencies
- Change app.json configuration
- Update Expo SDK version
- Need to submit to app stores

```bash
# Create builds manually
eas build --platform all --profile production --wait
```

## Monitoring

- **Update Status**: Check GitHub Actions tab (completes in ~3 minutes)
- **EAS Dashboard**: https://expo.dev/accounts/maverik77/projects/2468_counter
- **User Analytics**: Available in EAS dashboard

## Troubleshooting

### Common Issues:
1. **Update fails**: Check GitHub Actions logs
2. **Update not received**: Check EAS dashboard for channel status
3. **Token expired**: Regenerate EXPO_TOKEN in GitHub secrets

### Manual Commands:
```bash
# Force update deployment
eas update --branch production --message "Manual update"

# Check update status
eas update:list --branch production

# Create builds when native changes are needed
eas build --platform all --profile production
```

## Benefits

✅ **Lightning fast** updates (2-3 minutes vs 30+ minutes)  
✅ **Reliable** GitHub Actions (no timeouts)  
✅ **Automatic deployment** on code changes  
✅ **Preview updates** for testing PRs  
✅ **No manual intervention** required  
✅ **Rollback capability** through EAS dashboard  
✅ **Cost effective** (fewer build minutes used)

## Architecture

```
Code Change → GitHub Actions → EAS Update → Users (2-3 minutes)
     ↓
Native Change → Manual Build → App Stores (when needed)
```

This approach gives you the best of both worlds: instant updates for most changes, with the ability to create full builds when necessary. 