const express = require('express');
const router = express.Router();
const jenkinsService = require('../services/jenkins');

// Get build history
router.get('/history', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = await jenkinsService.getBuildHistory(limit);
    res.json(history);
  } catch (error) {
    console.error('Error fetching build history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch build history',
      message: error.message 
    });
  }
});

// Get specific build details
router.get('/:jobName/:buildNumber', async (req, res) => {
  try {
    const { jobName, buildNumber } = req.params;
    const build = await jenkinsService.getBuildDetails(jobName, buildNumber);
    res.json(build);
  } catch (error) {
    console.error('Error fetching build details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch build details',
      message: error.message 
    });
  }
});

// Trigger a new build
router.post('/trigger/:jobName', async (req, res) => {
  try {
    const { jobName } = req.params;
    const result = await jenkinsService.triggerBuild(jobName);
    res.json(result);
  } catch (error) {
    console.error('Error triggering build:', error);
    res.status(500).json({ 
      error: 'Failed to trigger build',
      message: error.message 
    });
  }
});

module.exports = router;

