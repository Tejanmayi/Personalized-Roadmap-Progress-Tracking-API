const express = require('express');
const router = express.Router();
const Roadmap = require('../models/Roadmap');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Get all roadmaps for user
router.get('/', auth, async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user._id });
    res.json(roadmaps);
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    res.status(500).json({ message: 'Error fetching roadmaps' });
  }
});

// Create new roadmap
router.post('/', [
  auth,
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('levels').isArray(),
  body('levels.*.levelId').isInt({ min: 1, max: 5 }),
  body('levels.*.title').notEmpty().trim(),
  body('levels.*.modules').isArray(),
  body('levels.*.modules.*.moduleId').notEmpty().trim(),
  body('levels.*.modules.*.title').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const roadmap = new Roadmap({
      ...req.body,
      user: req.user._id
    });

    await roadmap.save();
    res.status(201).json(roadmap);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ errors: Object.values(error.errors).map(e => e.message) });
    }
    console.error('Error creating roadmap:', error);
    res.status(500).json({ message: 'Error creating roadmap' });
  }
});

// Get specific roadmap
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    res.json(roadmap);
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({ message: 'Error fetching roadmap' });
  }
});

// Update roadmap
router.patch('/:id', [
  auth,
  body('title').optional().trim(),
  body('description').optional().trim(),
  body('levels').optional().isArray(),
  body('levels.*.levelId').optional().isInt({ min: 1, max: 5 }),
  body('levels.*.title').optional().trim(),
  body('levels.*.modules').optional().isArray(),
  body('levels.*.modules.*.moduleId').optional().trim(),
  body('levels.*.modules.*.title').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    // First check if the roadmap exists and belongs to the user
    const existingRoadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!existingRoadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    const roadmap = await Roadmap.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(roadmap);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ errors: Object.values(error.errors).map(e => e.message) });
    }
    console.error('Error updating roadmap:', error);
    res.status(500).json({ message: 'Error updating roadmap' });
  }
});

// Delete roadmap
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    // First check if the roadmap exists and belongs to the user
    const existingRoadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!existingRoadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    const roadmap = await Roadmap.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    res.json({ message: 'Roadmap deleted successfully' });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    res.status(500).json({ message: 'Error deleting roadmap' });
  }
});

module.exports = router; 