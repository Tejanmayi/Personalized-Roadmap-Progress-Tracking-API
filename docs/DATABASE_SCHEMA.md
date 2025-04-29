# Database Schema Documentation

This document describes the database schemas used in the Personalized Roadmap API.

## User Schema

```javascript
{
  _id: ObjectId,
  email: String,          // Unique, required
  password: String,       // Hashed, required
  name: String,          // Required
  learningPreferences: {
    preferredModalities: [String],  // ['video', 'text', 'hands-on', etc.]
    difficultyPreference: String,   // 'beginner', 'intermediate', 'advanced'
    privacySettings: {
      shareAnalytics: Boolean,     // Default: false
      shareProgress: Boolean,      // Default: true
      shareAchievements: Boolean   // Default: true
    }
  },
  createdAt: Date,       // Auto-generated
  updatedAt: Date        // Auto-updated
}
```

### Indexes
- `email`: Unique index
- `createdAt`: Index for sorting

## Roadmap Schema

```javascript
{
  _id: ObjectId,
  user: ObjectId,        // Reference to User, required
  title: String,         // Required
  description: String,   // Optional
  levels: [{
    levelId: Number,     // Required, 1-5
    title: String,       // Required
    modules: [{
      moduleId: String,  // Required, unique within level
      title: String,     // Required
      completionStatus: String,  // 'not_started', 'in_progress', 'completed'
      timeSpent: Number, // In minutes
      userNotes: String, // Optional
      lastAccessed: Date,
      completedAt: Date,
      attempts: [{
        timestamp: Date,
        timeSpent: Number,
        status: String,
        learningAnalytics: {
          confidenceScore: Number,    // 1-5 scale
          difficultyRating: Number,   // 1-5 scale
          resourcesUsed: [String],    // IDs of used resources
          preferredModality: [String], // ['video', 'text', 'hands-on', etc.]
          commonErrors: [String],     // Error categories encountered
          conceptsToReview: [String]  // Concepts needing review
        }
      }],
      learningAnalytics: {
        averageConfidenceScore: Number,  // Calculated from attempts
        averageDifficultyRating: Number, // Calculated from attempts
        mostUsedResources: [String],     // Most frequently used resources
        mostCommonErrors: [String],      // Most frequent error categories
        revisitCount: Number,            // Number of times module was revisited
        lastRevisitDate: Date,           // Last time module was revisited
        peerComparison: {
          averageCompletionTime: Number,  // Average time across all users
          completionTimePercentile: Number, // User's percentile
          averageConfidenceScore: Number,   // Average confidence across users
          confidenceScorePercentile: Number // User's confidence percentile
        }
      },
      averageTimePerAttempt: Number
    }],
    progress: Number,    // 0-100
    completedAt: Date,
    totalTimeSpent: Number,
    averageModuleTime: Number,
    learningAnalytics: {
      averageConfidenceScore: Number,    // Across all modules
      averageDifficultyRating: Number,   // Across all modules
      mostChallengingModules: [String],  // Module IDs
      mostConfidentModules: [String],    // Module IDs
      preferredLearningModalities: [String] // Most used modalities
    }
  }],
  overallProgress: Number,  // 0-100
  totalTimeSpent: Number,
  averageLevelTime: Number,
  completionRate: Number,   // 0-100
  achievements: [{
    type: String,        // Achievement type
    title: String,       // Achievement title
    description: String, // Achievement description
    earnedAt: Date      // When achievement was earned
  }],
  learningAnalytics: {
    overallConfidenceScore: Number,     // Across all modules
    overallDifficultyRating: Number,    // Across all modules
    preferredLearningModalities: [String], // Most used modalities
    mostChallengingAreas: [String],     // Topic areas
    mostConfidentAreas: [String],       // Topic areas
    peerComparison: {
      progressPercentile: Number,       // User's progress percentile
      averageConfidencePercentile: Number, // User's confidence percentile
      averageDifficultyPercentile: Number  // User's difficulty percentile
    }
  },
  version: Number,       // For optimistic locking
  createdAt: Date,      // Auto-generated
  updatedAt: Date,      // Auto-updated
  lastActivity: Date    // Last user interaction
}
```

### Indexes
- `user`: Index for user queries
- `createdAt`: Index for sorting
- `lastActivity`: Index for activity tracking
- Compound index: `{ user: 1, createdAt: -1 }` for user's roadmaps
- Compound index: `{ "learningAnalytics.overallConfidenceScore": 1 }` for analytics
- Compound index: `{ "learningAnalytics.overallDifficultyRating": 1 }` for analytics

## Resource Schema (New)

```javascript
{
  _id: ObjectId,
  type: String,          // 'video', 'article', 'exercise', etc.
  title: String,         // Required
  description: String,   // Optional
  url: String,          // Required
  moduleId: String,     // Reference to module
  levelId: Number,      // Reference to level
  tags: [String],       // For categorization
  usageStats: {
    totalUses: Number,
    averageConfidenceGain: Number,
    averageDifficultyReduction: Number,
    userRatings: [{
      userId: ObjectId,
      rating: Number,    // 1-5 scale
      feedback: String
    }]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `moduleId`: Index for module queries
- `type`: Index for resource type queries
- Compound index: `{ moduleId: 1, type: 1 }` for module resources

## Cache Schema

The application uses NodeCache for caching with the following key patterns:

```javascript
// User roadmaps cache
`user_roadmaps:${userId}`

// Roadmap cache
`roadmap:${roadmapId}`

// Progress cache
`progress:${roadmapId}`

// Analytics cache
`analytics:${userId}`

// Learning analytics cache
`learning_analytics:${userId}`
```

### Cache TTLs
- User roadmaps: 10 minutes
- Roadmap data: 5 minutes
- Progress data: 1 minute
- Analytics: 15 minutes
- Learning analytics: 30 minutes

## Data Relationships

1. **User to Roadmaps**
   - One-to-Many relationship
   - User can have multiple roadmaps
   - Each roadmap belongs to one user

2. **Roadmap to Levels**
   - One-to-Many relationship
   - Each roadmap has multiple levels
   - Levels are ordered by levelId

3. **Level to Modules**
   - One-to-Many relationship
   - Each level has multiple modules
   - Modules are identified by moduleId within a level

4. **Module to Resources**
   - One-to-Many relationship
   - Each module can have multiple resources
   - Resources are categorized by type

## Data Validation

1. **User Validation**
   - Email must be unique
   - Password must be at least 6 characters
   - Name is required
   - Learning preferences are optional

2. **Roadmap Validation**
   - Title is required
   - Levels must be an array
   - Each level must have a valid levelId (1-5)
   - Each module must have a unique moduleId within its level

3. **Progress Validation**
   - Completion status must be one of: 'not_started', 'in_progress', 'completed'
   - Time spent must be a positive number
   - Progress values must be between 0 and 100
   - Confidence and difficulty ratings must be between 1 and 5

4. **Resource Validation**
   - Type must be one of: 'video', 'article', 'exercise', etc.
   - Title and URL are required
   - ModuleId and levelId must reference valid entities

## Performance Considerations

1. **Indexing Strategy**
   - Indexes on frequently queried fields
   - Compound indexes for common query patterns
   - Indexes on fields used in sorting
   - Indexes on analytics fields for reporting

2. **Caching Strategy**
   - Cache frequently accessed data
   - Use appropriate TTLs based on data volatility
   - Implement cache invalidation on updates
   - Cache analytics data separately

3. **Query Optimization**
   - Use projection to limit returned fields
   - Implement pagination for large result sets
   - Use efficient query patterns
   - Aggregate analytics data periodically

4. **Privacy Considerations**
   - Implement data anonymization for analytics
   - Respect user privacy settings
   - Provide opt-out mechanisms
   - Clear documentation of data usage 