const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get all projects (filtered by role internally)
router.get('/', auth, projectController.getProjects);

// Update a project (both HR and assigned Employee can do this)
router.put('/:id', auth, projectController.updateProject);

// Create a project (HR only)
router.post('/', auth, roleCheck(['hr']), projectController.createProject);

// Delete a project (HR only)
router.delete('/:id', auth, roleCheck(['hr']), projectController.deleteProject);

module.exports = router;
