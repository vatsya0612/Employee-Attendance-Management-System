const Project = require('../models/Project');

exports.createProject = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate } = req.body;
    const project = new Project({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      dueDate
    });
    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getProjects = async (req, res) => {
  try {
    let query = {};
    // If employee, only see their assigned projects
    if (req.user.role === 'employee') {
      query.assignedTo = req.user.id;
    }
    const projects = await Project.find(query)
      .populate('assignedTo', 'name employeeId')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { status, progress } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    
    // Only HR or the assigned employee can update
    if (req.user.role !== 'hr' && project.assignedTo.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    if (status) project.status = status;
    if (progress !== undefined) project.progress = progress;

    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    
    await project.deleteOne();
    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
