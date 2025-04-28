const express = require('express');
const router = express.Router();
const Roadmap = require('../models/Roadmap');
const auth = require('../middleware/auth');
const CacheService = require('../services/cache');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const MAX_RETRIES = 3;

// Update module progress
router.patch('/:roadmapId/levels/:levelId/modules/:moduleId', [
  auth,
  body('completionStatus').isBoolean(),
  body('timeSpent').isInt({ min: 0 }),
  body('userNotes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.roadmapId)) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    const roadmap = await Roadmap.findOne({
      _id: req.params.roadmapId,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    const level = roadmap.levels.find(l => l.levelId === parseInt(req.params.levelId));
    if (!level) {
      return res.status(404).json({ message: 'Level not found' });
    }

    const module = level.modules.find(m => m.moduleId === req.params.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Update module progress
    module.completionStatus = req.body.completionStatus ? 'completed' : 'in_progress';
    module.timeSpent = req.body.timeSpent;
    if (req.body.userNotes !== undefined) {
      module.userNotes = req.body.userNotes;
    }
    module.lastAccessed = new Date();
    
    if (req.body.completionStatus && !module.completedAt) {
      module.completedAt = new Date();
    }

    // Update level progress
    level.progress = (level.modules.filter(m => m.completionStatus === 'completed').length / level.modules.length) * 100;
    level.totalTimeSpent = level.modules.reduce((sum, m) => sum + m.timeSpent, 0);
    level.averageModuleTime = level.totalTimeSpent / level.modules.length;

    if (level.progress === 100 && !level.completedAt) {
      level.completedAt = new Date();
    }

    // Update overall roadmap progress
    roadmap.overallProgress = (roadmap.levels.reduce((sum, l) => sum + l.progress, 0) / roadmap.levels.length);
    roadmap.totalTimeSpent = roadmap.levels.reduce((sum, l) => sum + l.totalTimeSpent, 0);
    roadmap.averageLevelTime = roadmap.totalTimeSpent / roadmap.levels.length;
    roadmap.completionRate = (roadmap.levels.filter(l => l.completedAt).length / roadmap.levels.length) * 100;

    // Initialize achievements array if it doesn't exist
    if (!roadmap.achievements) {
      roadmap.achievements = [];
    }

    // Check and update achievements
    const newAchievements = checkAchievements(roadmap);
    if (newAchievements && newAchievements.length > 0) {
      roadmap.achievements.push(...newAchievements);
    }

    // Save with optimistic locking
    const updatedRoadmap = await Roadmap.findOneAndUpdate(
      {
        _id: roadmap._id,
        user: req.user._id,
        version: roadmap.version
      },
      {
        $set: {
          levels: roadmap.levels,
          overallProgress: roadmap.overallProgress,
          totalTimeSpent: roadmap.totalTimeSpent,
          averageLevelTime: roadmap.averageLevelTime,
          completionRate: roadmap.completionRate,
          achievements: roadmap.achievements,
          lastActivity: new Date()
        },
        $inc: { version: 1 }
      },
      { new: true, runValidators: true }
    );

    if (!updatedRoadmap) {
      throw new Error('Optimistic lock failed');
    }

    // Invalidate cache
    await CacheService.invalidateProgressData(roadmap._id.toString());

    // Format response to match test expectations
    res.json({
      success: true,
      module: {
        levelId: level.levelId,
        moduleId: module.moduleId,
        title: module.title,
        completionStatus: req.body.completionStatus,
        timeSpent: module.timeSpent,
        userNotes: module.userNotes,
        lastAccessed: module.lastAccessed,
        completedAt: module.completedAt
      },
      progress: {
        levelProgress: level.progress,
        overallProgress: roadmap.overallProgress
      },
      nextModule: roadmap.getNextModule ? roadmap.getNextModule() : null,
      achievements: newAchievements.length > 0 ? newAchievements : undefined
    });
  } catch (error) {
    console.error('Error updating module progress:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ errors: Object.values(error.errors).map(e => e.message) });
    }
    res.status(500).json({ message: 'Error updating module progress' });
  }
});

// Get progress statistics with caching
router.get('/:roadmapId/stats', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.roadmapId)) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    const stats = await CacheService.getProgress(
      req.user._id,
      req.params.roadmapId,
      async () => {
        const roadmap = await Roadmap.findOne({
          _id: req.params.roadmapId,
          user: req.user._id
        });

        if (!roadmap) {
          return null;
        }

        // Calculate level progress
        const levels = roadmap.levels.map(level => {
          const completedModules = level.modules.filter(m => m.completionStatus === 'completed').length;
          const progress = (completedModules / level.modules.length) * 100;
          return {
            levelId: level.levelId,
            title: level.title,
            progress,
            completedModules,
            totalModules: level.modules.length,
            totalTimeSpent: level.modules.reduce((sum, m) => sum + (m.timeSpent || 0), 0),
            averageModuleTime: level.modules.reduce((sum, m) => sum + (m.timeSpent || 0), 0) / level.modules.length
          };
        });

        // Calculate overall progress
        const totalModules = levels.reduce((sum, l) => sum + l.totalModules, 0);
        const completedModules = levels.reduce((sum, l) => sum + l.completedModules, 0);
        const overallProgress = (completedModules / totalModules) * 100;

        // Find current level and module
        const currentLevel = levels.find(l => l.progress < 100)?.levelId || levels[0].levelId;
        const currentLevelObj = roadmap.levels.find(l => l.levelId === currentLevel);
        const currentModule = currentLevelObj.modules.find(m => m.completionStatus !== 'completed')?.moduleId || currentLevelObj.modules[0].moduleId;

        return {
          overallProgress,
          currentLevel,
          currentModule,
          levels,
          achievements: roadmap.achievements || [],
          nextModule: roadmap.getNextModule ? roadmap.getNextModule() : null
        };
      }
    );

    if (!stats) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching progress statistics:', error);
    res.status(500).json({ message: 'Error fetching progress statistics' });
  }
});

// Get user analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const analytics = await CacheService.getAnalytics(
      req.user._id,
      async () => {
        const roadmaps = await Roadmap.find({ user: req.user._id })
          .select('overallProgress totalTimeSpent averageLevelTime completionRate difficulty lastActivity')
          .sort({ lastActivity: -1 });

        return {
          totalRoadmaps: roadmaps.length,
          averageProgress: roadmaps.reduce((acc, r) => acc + r.overallProgress, 0) / roadmaps.length,
          totalTimeSpent: roadmaps.reduce((acc, r) => acc + r.totalTimeSpent, 0),
          averageLevelTime: roadmaps.reduce((acc, r) => acc + r.averageLevelTime, 0) / roadmaps.length,
          completionRate: roadmaps.reduce((acc, r) => acc + r.completionRate, 0) / roadmaps.length,
          recentActivity: roadmaps[0]?.lastActivity,
          difficultyDistribution: roadmaps.reduce((acc, r) => {
            acc[r.difficulty] = (acc[r.difficulty] || 0) + 1;
            return acc;
          }, {})
        };
      }
    );

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

function checkAchievements(roadmap) {
  if (!roadmap) return [];

  const achievements = [];
  const completedModules = roadmap.levels.reduce((sum, level) => 
    sum + level.modules.filter(m => m.completionStatus === 'completed').length, 0);
  const totalModules = roadmap.levels.reduce((sum, level) => sum + level.modules.length, 0);

  // First module completion
  if (completedModules === 1) {
    achievements.push({
      type: 'first_module',
      title: 'First Steps',
      description: 'Completed your first module',
      earnedAt: new Date()
    });
  }

  // Level completion achievements
  const completedLevels = roadmap.levels.filter(l => l.completedAt).length;
  if (completedLevels === 1) {
    achievements.push({
      type: 'first_level',
      title: 'Level Master',
      description: 'Completed your first level',
      earnedAt: new Date()
    });
  }

  // Progress milestones
  const progressMilestones = [25, 50, 75, 100];
  const currentProgress = Math.floor(roadmap.overallProgress);
  
  progressMilestones.forEach(milestone => {
    if (currentProgress >= milestone) {
      achievements.push({
        type: `progress_${milestone}`,
        title: `${milestone}% Complete`,
        description: `Reached ${milestone}% completion`,
        earnedAt: new Date()
      });
    }
  });

  return achievements;
}

module.exports = router; 