const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  learningAnalytics: {
    confidenceScore: {
      type: Number,
      min: 1,
      max: 5
    },
    difficultyRating: {
      type: Number,
      min: 1,
      max: 5
    },
    resourcesUsed: [{
      type: String
    }],
    preferredModality: [{
      type: String,
      enum: ['video', 'text', 'hands-on', 'audio', 'interactive']
    }],
    commonErrors: [{
      type: String
    }],
    conceptsToReview: [{
      type: String
    }]
  }
});

const moduleSchema = new mongoose.Schema({
  moduleId: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  completionStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  userNotes: {
    type: String,
    trim: true
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: {
    type: Date,
    index: true
  },
  attempts: [attemptSchema],
  learningAnalytics: {
    averageConfidenceScore: {
      type: Number,
      min: 1,
      max: 5
    },
    averageDifficultyRating: {
      type: Number,
      min: 1,
      max: 5
    },
    mostUsedResources: [{
      type: String
    }],
    mostCommonErrors: [{
      type: String
    }],
    revisitCount: {
      type: Number,
      default: 0
    },
    lastRevisitDate: Date,
    peerComparison: {
      averageCompletionTime: Number,
      completionTimePercentile: Number,
      averageConfidenceScore: Number,
      confidenceScorePercentile: Number
    }
  },
  averageTimePerAttempt: {
    type: Number,
    default: 0
  }
});

const levelSchema = new mongoose.Schema({
  levelId: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  modules: [moduleSchema],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true
  },
  completedAt: {
    type: Date,
    index: true
  },
  totalTimeSpent: {
    type: Number,
    default: 0
  },
  averageModuleTime: {
    type: Number,
    default: 0
  },
  learningAnalytics: {
    averageConfidenceScore: {
      type: Number,
      min: 1,
      max: 5
    },
    averageDifficultyRating: {
      type: Number,
      min: 1,
      max: 5
    },
    mostChallengingModules: [{
      type: String
    }],
    mostConfidentModules: [{
      type: String
    }],
    preferredLearningModalities: [{
      type: String,
      enum: ['video', 'text', 'hands-on', 'audio', 'interactive']
    }]
  }
});

const roadmapSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  levels: [levelSchema],
  currentLevel: {
    type: Number,
    default: 1,
    index: true
  },
  currentModule: {
    type: String,
    default: '1.1',
    index: true
  },
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true
  },
  achievements: [{
    type: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  learningAnalytics: {
    overallConfidenceScore: {
      type: Number,
      min: 1,
      max: 5
    },
    overallDifficultyRating: {
      type: Number,
      min: 1,
      max: 5
    },
    preferredLearningModalities: [{
      type: String,
      enum: ['video', 'text', 'hands-on', 'audio', 'interactive']
    }],
    mostChallengingAreas: [{
      type: String
    }],
    mostConfidentAreas: [{
      type: String
    }],
    peerComparison: {
      progressPercentile: Number,
      averageConfidencePercentile: Number,
      averageDifficultyPercentile: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  totalTimeSpent: {
    type: Number,
    default: 0
  },
  averageLevelTime: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

roadmapSchema.index({ user: 1, overallProgress: -1 });
roadmapSchema.index({ user: 1, lastActivity: -1 });
roadmapSchema.index({ user: 1, currentLevel: 1, currentModule: 1 });

roadmapSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.lastActivity = Date.now();
  this.version += 1;
  next();
});

roadmapSchema.methods.calculateProgress = function() {
  if (this.levels.length === 0) return 0;
  const totalProgress = this.levels.reduce((sum, level) => sum + level.progress, 0);
  return totalProgress / this.levels.length;
};

roadmapSchema.methods.getNextModule = function() {
  for (let level of this.levels) {
    for (let module of level.modules) {
      if (!module.completionStatus) {
        return {
          levelId: level.levelId,
          moduleId: module.moduleId,
          title: module.title,
          difficulty: this.difficulty
        };
      }
    }
  }
  return null;
};

roadmapSchema.methods.updateModuleAttempt = function(levelId, moduleId, timeSpent) {
  const level = this.levels.find(l => l.levelId === levelId);
  if (!level) return null;

  const module = level.modules.find(m => m.moduleId === moduleId);
  if (!module) return null;

  module.attempts += 1;
  module.timeSpent += timeSpent;
  module.averageTimePerAttempt = module.timeSpent / module.attempts;
  module.lastAccessed = new Date();

  return module;
};

roadmapSchema.methods.getAnalytics = function() {
  return {
    overallProgress: this.overallProgress,
    totalTimeSpent: this.totalTimeSpent,
    averageLevelTime: this.averageLevelTime,
    completionRate: this.completionRate,
    levelProgress: this.levels.map(level => ({
      levelId: level.levelId,
      progress: level.progress,
      totalTimeSpent: level.totalTimeSpent,
      averageModuleTime: level.averageModuleTime
    })),
    recentActivity: this.lastActivity,
    difficulty: this.difficulty
  };
};

roadmapSchema.methods.updateLearningAnalytics = function() {
  if (this.levels.length === 0) return;

  this.learningAnalytics.overallConfidenceScore = this.levels.reduce((sum, level) => 
    sum + level.learningAnalytics.averageConfidenceScore, 0) / this.levels.length;

  this.learningAnalytics.overallDifficultyRating = this.levels.reduce((sum, level) => 
    sum + level.learningAnalytics.averageDifficultyRating, 0) / this.levels.length;

  this.learningAnalytics.preferredLearningModalities = this.levels.reduce((acc, level) => {
    level.modules.forEach(module => {
      if (module.learningAnalytics.mostUsedResources.length > 0) {
        acc.push(...module.learningAnalytics.mostUsedResources);
      }
    });
    return acc;
  }, []);

  this.learningAnalytics.mostChallengingAreas = this.levels.reduce((acc, level) => {
    level.modules.forEach(module => {
      if (module.learningAnalytics.mostChallengingModules.length > 0) {
        acc.push(...module.learningAnalytics.mostChallengingModules);
      }
    });
    return acc;
  }, []);

  this.learningAnalytics.mostConfidentAreas = this.levels.reduce((acc, level) => {
    level.modules.forEach(module => {
      if (module.learningAnalytics.mostConfidentModules.length > 0) {
        acc.push(...module.learningAnalytics.mostConfidentModules);
      }
    });
    return acc;
  }, []);

  this.learningAnalytics.peerComparison.progressPercentile = this.overallProgress;
  this.learningAnalytics.peerComparison.averageConfidencePercentile = this.learningAnalytics.overallConfidenceScore * 100;
  this.learningAnalytics.peerComparison.averageDifficultyPercentile = this.learningAnalytics.overallDifficultyRating * 100;
};

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

module.exports = Roadmap; 