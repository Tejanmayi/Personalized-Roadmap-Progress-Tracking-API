const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['video', 'text', 'hands-on', 'audio', 'interactive'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  duration: {
    type: Number, // in minutes
    min: 0
  },
  tags: [{
    type: String
  }],
  prerequisites: [{
    type: String
  }],
  learningObjectives: [{
    type: String
  }],
  usage: {
    totalViews: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    averageTimeSpent: {
      type: Number,
      default: 0
    }
  },
  analytics: {
    userFeedback: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    effectiveness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    difficultyRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    mostCommonUseCases: [{
      type: String
    }],
    relatedResources: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource'
    }]
  },
  metadata: {
    author: String,
    source: String,
    lastUpdated: Date,
    version: {
      type: Number,
      default: 1
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'draft'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
resourceSchema.index({ title: 'text', description: 'text' });
resourceSchema.index({ type: 1, difficulty: 1 });
resourceSchema.index({ 'usage.totalViews': -1 });
resourceSchema.index({ 'analytics.effectiveness': -1 });

// Method to update resource analytics
resourceSchema.methods.updateAnalytics = function() {
  if (this.analytics.userFeedback.length === 0) return;

  const totalRatings = this.analytics.userFeedback.length;
  const totalRating = this.analytics.userFeedback.reduce((sum, feedback) => sum + feedback.rating, 0);
  
  this.usage.averageRating = totalRating / totalRatings;
  
  // Calculate effectiveness based on completion rate and user ratings
  this.analytics.effectiveness = (this.usage.completionRate * 0.7) + (this.usage.averageRating * 20);
  
  // Update difficulty rating
  const totalDifficulty = this.analytics.userFeedback.reduce((sum, feedback) => 
    sum + (feedback.difficultyRating || 0), 0);
  this.analytics.difficultyRating = totalDifficulty / totalRatings;
};

// Method to add user feedback
resourceSchema.methods.addFeedback = function(userId, rating, comment) {
  this.analytics.userFeedback.push({
    userId,
    rating,
    comment
  });
  
  this.usage.totalViews += 1;
  this.updateAnalytics();
};

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource; 