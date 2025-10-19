# Data Storage Options for User Profiles

## 🤔 Your Question: "Why do we need Cognito?"

You're absolutely right to question this! Since you're already using DynamoDB for study groups, you have several options for storing user profile data (university, class name, etc.). Let me explain the different approaches:

## 📊 Data Storage Options

### Option 1: **DynamoDB User Profiles** (Recommended for your use case)
**Pros:**
- ✅ Consistent with your study groups storage
- ✅ More flexible schema (easy to add new fields)
- ✅ Better for complex queries and relationships
- ✅ Can store rich user data (bio, preferences, etc.)
- ✅ Easier to backup and migrate
- ✅ Better for analytics and reporting

**Cons:**
- ❌ Requires additional DynamoDB table
- ❌ More complex queries for simple user data

### Option 2: **Cognito User Attributes** (Current approach)
**Pros:**
- ✅ Simple and integrated with authentication
- ✅ Automatic user lifecycle management
- ✅ Built-in user management in AWS Console

**Cons:**
- ❌ Limited to predefined attribute types
- ❌ Harder to query and analyze
- ❌ Less flexible for complex user data
- ❌ Custom attributes require manual setup

### Option 3: **Hybrid Approach** (Best of both worlds)
**Pros:**
- ✅ Basic info in Cognito (name, email)
- ✅ Extended profile in DynamoDB (university, class, preferences)
- ✅ Leverages strengths of both systems

**Cons:**
- ❌ More complex data management
- ❌ Potential data consistency issues

## 🎯 **Recommendation: Use DynamoDB for User Profiles**

For your study group app, I recommend **Option 1 (DynamoDB)** because:

1. **Consistency**: You're already using DynamoDB for study groups
2. **Flexibility**: Easy to add new user fields (year, major, interests, etc.)
3. **Relationships**: Can easily link users to study groups
4. **Queries**: Can find users by university, class, etc.
5. **Scalability**: Better for future features

## 🛠️ Implementation

I've created a new system that gives you both options:

### **Current Implementation (Cognito + DynamoDB)**
- **Signup**: Stores basic info in Cognito + creates DynamoDB profile
- **Development**: Uses localStorage for testing
- **Production**: Uses DynamoDB table for user profiles

### **Files Created/Modified:**
- `lib/aws-user-profiles.ts` - New DynamoDB user profile system
- Updated signup forms to collect university + class name
- Updated auth contexts to handle new fields

## 📋 DynamoDB Table Schema

```typescript
// UserProfiles table
{
  userId: string,        // Primary key (email or Cognito user ID)
  email: string,
  givenName: string,
  familyName: string,
  university: string,    // University of Washington, etc.
  className: string,     // CSE 142, MATH 124, etc.
  createdAt: string,     // ISO timestamp
  updatedAt: string      // ISO timestamp
}
```

## 🚀 Next Steps

### **For Development (Current)**
- ✅ University and class fields added to signup form
- ✅ Data stored in localStorage for testing
- ✅ Ready to test immediately

### **For Production (AWS Setup)**
1. **Create DynamoDB Table:**
   ```bash
   # Table name: UserProfiles
   # Primary key: userId (String)
   # No sort key needed
   ```

2. **Update IAM Permissions:**
   - Add DynamoDB permissions for UserProfiles table
   - Allow PutItem, GetItem, UpdateItem operations

3. **Optional: Remove Cognito Custom Attributes**
   - If you want to use only DynamoDB
   - Remove `custom:university` and `custom:className` from signup

## 🔄 Migration Path

### **Phase 1: Current (Hybrid)**
- Keep Cognito for authentication
- Store extended profile in DynamoDB
- Both systems work together

### **Phase 2: Full DynamoDB (Optional)**
- Move all user data to DynamoDB
- Keep Cognito only for authentication
- More consistent with your study groups approach

## 💡 Benefits of DynamoDB Approach

1. **Study Group Integration**: Easy to find users by university/class
2. **Future Features**: Can add user preferences, bio, profile picture
3. **Analytics**: Can analyze user demographics
4. **Flexibility**: Easy to modify user schema
5. **Consistency**: Same storage as study groups

## 🧪 Testing

The current implementation works in both modes:
- **Dev Mode**: Uses localStorage (no AWS setup needed)
- **AWS Mode**: Uses DynamoDB (requires table setup)

You can test immediately with the new university and class fields!

## 📝 Summary

**You're right** - since you're using DynamoDB for study groups, it makes sense to use it for user profiles too. The new system I've created gives you:

- ✅ University and class name fields in signup
- ✅ DynamoDB-based user profile storage
- ✅ Development mode with localStorage
- ✅ Easy migration path
- ✅ Consistent with your existing architecture

Would you like me to help you set up the DynamoDB table, or would you prefer to test the current implementation first?
