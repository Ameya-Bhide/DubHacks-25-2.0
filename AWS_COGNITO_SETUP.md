# AWS Cognito Setup - Step by Step

Follow these steps to set up AWS Cognito for your Study Group App.

## Step 1: Create AWS Account (if you don't have one)

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Sign up for a free account (includes 12 months free tier)
3. Complete the verification process

## Step 2: Create Cognito User Pool

1. **Navigate to Cognito**
   - In AWS Console, search for "Cognito"
   - Click on "Amazon Cognito"

2. **Create User Pool**
   - Click "Create user pool"
   - Choose "Step through settings"

3. **Configure Sign-in Options**
   - ✅ Email
   - ✅ Username
   - Click "Next"

4. **Configure Security Requirements**
   - Password policy: Use default (minimum 8 characters)
   - Multi-factor authentication: Optional (can enable later)
   - Click "Next"

5. **Configure Sign-up Experience**
   - ✅ Self-service sign-up: Enable
   - ✅ Cognito-assisted verification: Enable
   - Required attributes: ✅ Email
   - Click "Next"

6. **Configure Message Delivery**
   - Email: ✅ Send email with Cognito
   - Click "Next"

7. **Integrate Your App**
   - User pool name: `study-group-app-pool`
   - App client name: `study-group-app-client`
   - ❌ **IMPORTANT**: Uncheck "Generate client secret"
   - Click "Next"

8. **Review and Create**
   - Review all settings
   - Click "Create user pool"

## Step 3: Get Your Configuration Values

After creating the user pool:

1. **User Pool ID**
   - Go to "General settings" tab
   - Copy the "User pool ID" (format: `us-east-1_XXXXXXXXX`)

2. **App Client ID**
   - Go to "App integration" tab
   - Under "App clients", copy the "Client ID"

3. **Region**
   - Note the AWS region (e.g., `us-east-1`)

## Step 4: Update Environment Variables

Update your `.env.local` file with the real values:

```env
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID=your-actual-client-id
```

## Step 5: Test the Setup

1. Restart your development server
2. Try signing up with a real email address
3. Check your email for the verification code
4. Complete the sign-up process
5. Sign in with your credentials

## Troubleshooting

### Common Issues:

1. **"User does not exist"**
   - Make sure you've confirmed your email address
   - Check if the user pool is in the correct region

2. **"Invalid client"**
   - Verify your App Client ID is correct
   - Make sure client secret is disabled

3. **"Region mismatch"**
   - Ensure the region in your .env.local matches your user pool region

### Cost Information:
- AWS Cognito free tier: 50,000 monthly active users
- Perfect for development and small applications

## Next Steps After Setup:

1. Test the authentication flow
2. Add user profile management
3. Implement role-based access control
4. Add social login providers (optional)
