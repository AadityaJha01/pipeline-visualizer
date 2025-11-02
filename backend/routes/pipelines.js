const express = require('express');
const router = express.Router();
const jenkinsService = require('../services/jenkins');

// Get all pipelines status
router.get('/status', async (req, res) => {
  try {
    const pipelines = await jenkinsService.getPipelineStatus();
    res.json(pipelines);
  } catch (error) {
    console.error('Error fetching pipeline status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pipeline status',
      message: error.message 
    });
  }
});

// Get specific pipeline details
router.get('/:jobName', async (req, res) => {
  try {
    const { jobName } = req.params;
    const pipeline = await jenkinsService.getPipelineDetails(jobName);
    res.json(pipeline);
  } catch (error) {
    console.error('Error fetching pipeline details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pipeline details',
      message: error.message 
    });
  }
});

module.exports = router;

