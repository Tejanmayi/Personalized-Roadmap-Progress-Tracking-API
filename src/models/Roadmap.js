const mongoose = require('mongoose');

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
    type: Boolean,
    default: false,
    index: true
  },
  timeSpent: {
    type: Number,
    default: 0
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
  attempts: {
    type: Number,
    default: 0
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
    index: true
  },
  achievements: [{
    id: String,
    title: String,
    description: String,
    unlockedAt: {
      type: Date,
      index: true
    }
  }],
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
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  version: {
    type: Number,
    default: 0
  }
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
  let totalModules = 0;
  let completedModules = 0;
  let totalTimeSpent = 0;

  this.levels.forEach(level => {
    const levelModules = level.modules.length;
    const completedLevelModules = level.modules.filter(m => m.completionStatus).length;
    const levelTimeSpent = level.modules.reduce((acc, m) => acc + m.timeSpent, 0);
    
    totalModules += levelModules;
    completedModules += completedLevelModules;
    totalTimeSpent += levelTimeSpent;
    
    level.progress = (completedLevelModules / levelModules) * 100;
    level.totalTimeSpent = levelTimeSpent;
    level.averageModuleTime = levelTimeSpent / levelModules;
  });

  this.overallProgress = (completedModules / totalModules) * 100;
  this.totalTimeSpent = totalTimeSpent;
  this.averageLevelTime = totalTimeSpent / this.levels.length;
  this.completionRate = (completedModules / totalModules) * 100;
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

module.exports = mongoose.model('Roadmap', roadmapSchema); 