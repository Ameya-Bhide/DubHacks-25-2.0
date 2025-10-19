// AWS Module Loader - Handles reliable loading of AWS Amplify modules
import { hasRealAWSConfig } from './aws-config'

let awsAuthModule: any = null
let awsUtilsModule: any = null
let loadingPromise: Promise<void> | null = null

export const loadAWSModules = async (): Promise<{ auth: any; utils: any }> => {
  // If modules are already loaded, return them
  if (awsAuthModule && awsUtilsModule) {
    return { auth: awsAuthModule, utils: awsUtilsModule }
  }

  // If we're already loading, wait for that promise
  if (loadingPromise) {
    await loadingPromise
    return { auth: awsAuthModule, utils: awsUtilsModule }
  }

  // Start loading
  loadingPromise = (async () => {
    try {
      console.log('🔄 Loading AWS Amplify modules...')
      
      // Load modules in parallel
      const [authModule, utilsModule] = await Promise.all([
        import('aws-amplify/auth'),
        import('aws-amplify/utils')
      ])
      
      awsAuthModule = authModule
      awsUtilsModule = utilsModule
      
      console.log('✅ AWS Amplify modules loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load AWS Amplify modules:', error)
      throw error
    }
  })()

  await loadingPromise
  return { auth: awsAuthModule, utils: awsUtilsModule }
}

export const isAWSModulesLoaded = (): boolean => {
  return awsAuthModule !== null && awsUtilsModule !== null
}

export const clearAWSModules = (): void => {
  awsAuthModule = null
  awsUtilsModule = null
  loadingPromise = null
}
