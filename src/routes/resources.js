const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Get all resources with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      type,
      difficulty,
      tags,
      search,
      page = 1,
      limit = 10,
      sortBy = 'usage.totalViews',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (type) query.type = type;
    if (difficulty) query.difficulty = parseInt(difficulty);
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$text = { $search: search };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const resources = await Resource.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Resource.countDocuments(query);

    res.json({
      resources,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Error fetching resources' });
  }
});

// Get a single resource by ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json(resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ message: 'Error fetching resource' });
  }
});

// Create a new resource
router.post('/', [
  auth,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(['video', 'text', 'hands-on', 'audio', 'interactive'])
    .withMessage('Invalid resource type'),
  body('url').isURL().withMessage('Valid URL is required'),
  body('difficulty').isInt({ min: 1, max: 5 })
    .withMessage('Difficulty must be between 1 and 5'),
  body('duration').optional().isInt({ min: 0 })
    .withMessage('Duration must be a positive number'),
  body('tags').optional().isArray(),
  body('prerequisites').optional().isArray(),
  body('learningObjectives').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const resource = new Resource({
      ...req.body,
      metadata: {
        ...req.body.metadata,
        author: req.user.id
      }
    });

    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ message: 'Error creating resource' });
  }
});

// Update a resource
router.patch('/:id', [
  auth,
  body('title').optional().trim().notEmpty(),
  body('type').optional()
    .isIn(['video', 'text', 'hands-on', 'audio', 'interactive']),
  body('url').optional().isURL(),
  body('difficulty').optional().isInt({ min: 1, max: 5 }),
  body('duration').optional().isInt({ min: 0 }),
  body('tags').optional().isArray(),
  body('prerequisites').optional().isArray(),
  body('learningObjectives').optional().isArray(),
  body('status').optional()
    .isIn(['active', 'archived', 'draft'])
], async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if user is the author or has admin rights
    if (resource.metadata.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this resource' });
    }

    Object.assign(resource, req.body);
    await resource.save();

    res.json(resource);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ message: 'Error updating resource' });
  }
});

// Delete a resource
router.delete('/:id', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    await Resource.deleteOne({ _id: req.params.id });
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: 'Error deleting resource' });
  }
});

// Add feedback to a resource
router.post('/:id/feedback', [
  auth,
  body('rating').isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    resource.addFeedback(req.user.id, req.body.rating, req.body.comment);
    await resource.save();

    res.json(resource);
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ message: 'Error adding feedback' });
  }
});

module.exports = router; 