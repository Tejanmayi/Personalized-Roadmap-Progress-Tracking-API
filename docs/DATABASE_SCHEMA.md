# Database Schema Documentation

This document describes the database schemas used in the Personalized Roadmap API.

## User Schema

```javascript
{
  _id: ObjectId,
  email: String,          // Unique, required
  password: String,       // Hashed, required
  name: String,          // Required
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
        status: String
      }],
      averageTimePerAttempt: Number
    }],
    progress: Number,    // 0-100
    completedAt: Date,
    totalTimeSpent: Number,
    averageModuleTime: Number
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
```

### Cache TTLs
- User roadmaps: 10 minutes
- Roadmap data: 5 minutes
- Progress data: 1 minute
- Analytics: 15 minutes

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

## Data Validation

1. **User Validation**
   - Email must be unique
   - Password must be at least 6 characters
   - Name is required

2. **Roadmap Validation**
   - Title is required
   - Levels must be an array
   - Each level must have a valid levelId (1-5)
   - Each module must have a unique moduleId within its level

3. **Progress Validation**
   - Completion status must be one of: 'not_started', 'in_progress', 'completed'
   - Time spent must be a positive number
   - Progress values must be between 0 and 100

## Performance Considerations

1. **Indexing Strategy**
   - Indexes on frequently queried fields
   - Compound indexes for common query patterns
   - Indexes on fields used in sorting

2. **Caching Strategy**
   - Cache frequently accessed data
   - Use appropriate TTLs based on data volatility
   - Implement cache invalidation on updates

3. **Query Optimization**
   - Use projection to limit returned fields
   - Implement pagination for large result sets
   - Use efficient query patterns 