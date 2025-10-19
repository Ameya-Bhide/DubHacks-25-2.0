# AWS Cognito Setup Guide

This guide will help you set up AWS Cognito for authentication in your Study Group App.

## Prerequisites

- AWS Account
- AWS CLI installed and configured (optional but recommended)

## Step 1: Create a Cognito User Pool

1. **Log into AWS Console**
   - Go to [AWS Console](https://console.aws.amazon.com/)
   - Navigate to **Cognito** service

2. **Create User Pool**
   - Click "Create user pool"
   - Choose "Step through settings"

3. **Configure Sign-in Options**
   - Select "Email" as the sign-in option
   - Click "Next"

4. **Configure Security Requirements**
   - Password policy: Choose your requirements (minimum 8 characters recommended)
   - Multi-factor authentication: Optional (can be enabled later)
   - Click "Next"

5. **Configure Sign-up Experience**
   - Self-service sign-up: Enable
   - Cognito-assisted verification: Enable
   - Required attributes: Email
   - Click "Next"

6. **Configure Message Delivery**
   - Email: Send email with Cognito
   - Click "Next"

7. **Integrate Your App**
   - User pool name: `study-group-app-pool`
   - App client name: `study-group-app-client`
   - Client secret: **Uncheck** this (we're using a public client)
   - Click "Next"

8. **Review and Create**
   - Review your settings
   - Click "Create user pool"

## Step 2: Get Your Configuration Values

After creating the user pool, you'll need these values:

1. **User Pool ID**
   - Found in the "General settings" tab
   - Format: `us-east-1_XXXXXXXXX`

2. **App Client ID**
   - Found in the "App integration" tab under "App clients"
   - Format: `your-client-id`

3. **Region**
   - The AWS region where you created the user pool
   - Example: `us-east-1`

## Step 3: Configure Your App

1. **Create Environment File**
   ```bash
   cp .env.example .env.local
   ```

2. **Update .env.local**
   ```env
   NEXT_PUBLIC_AWS_REGION=us-east-1
   NEXT_PUBLIC_AWS_USER_POOL_ID=us-east-1_XXXXXXXXX
   NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID=your-client-id
   ```

3. **Replace the placeholder values** with your actual Cognito configuration

## Step 4: Test the Setup

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Test Sign Up**
   - Go to the app
   - Click "Sign up here"
   - Create a new account
   - Check your email for verification code

3. **Test Sign In**
   - Use the verification code to confirm your account
   - Sign in with your credentials

## Step 5: Optional - Configure Domain

For production, you might want to set up a custom domain:

1. **In Cognito Console**
   - Go to "App integration" tab
   - Under "Domain", click "Create Cognito domain"
   - Choose a domain name
   - Save

## Troubleshooting

### Common Issues

1. **"User does not exist"**
   - Make sure you've confirmed your email address
   - Check if the user pool is in the correct region

2. **"Invalid client"**
   - Verify your App Client ID is correct
   - Make sure client secret is disabled for public clients

3. **"Region mismatch"**
   - Ensure the region in your .env.local matches your user pool region

### Debug Mode

To see detailed error messages, check the browser console and terminal logs.

## Security Notes

- Never commit your `.env.local` file to version control
- Use environment variables for all sensitive configuration
- Consider enabling MFA for production use
- Regularly rotate your AWS credentials

## Next Steps

Once authentication is working, you can:
- Add user profile management
- Implement role-based access control
- Add social login providers (Google, Facebook, etc.)
- Set up user groups for study groups
