// Development authentication fallback
// This allows the app to work without AWS Cognito setup

export const isDevMode = () => {
  return process.env.NODE_ENV === 'development' && 
         (!process.env.NEXT_PUBLIC_AWS_USER_POOL_ID || 
          process.env.NEXT_PUBLIC_AWS_USER_POOL_ID === 'us-east-1_XXXXXXXXX')
}

export const devAuth = {
  signIn: async (email: string, password: string) => {
    // Simple dev authentication - accepts any email/password
    if (email && password) {
      return {
        username: email,
        signInDetails: {
          loginId: email
        }
      }
    }
    throw new Error('Invalid credentials')
  },
  
  signUp: async (email: string, password: string, givenName: string, familyName: string) => {
    // Simple dev signup - always succeeds
    return {
      isSignUpComplete: false,
      nextStep: {
        signUpStep: 'CONFIRM_SIGN_UP',
        codeDeliveryDetails: {
          destination: email,
          deliveryMedium: 'EMAIL',
          attributeName: 'email'
        }
      }
    }
  },
  
  confirmSignUp: async (email: string, code: string) => {
    // Simple dev confirmation - accepts any code
    return { isSignUpComplete: true }
  },
  
  resendSignUpCode: async (email: string) => {
    return { isCodeDeliverySuccessful: true }
  },
  
  signOut: async () => {
    return true
  },
  
  getCurrentUser: async () => {
    // Check if user is in localStorage for dev mode
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('dev-user')
      if (user) {
        return JSON.parse(user)
      }
    }
    throw new Error('No user found')
  }
}
