const axios = require('axios');

class JenkinsService {
  constructor() {
    this.baseURL = process.env.JENKINS_URL;
    this.username = process.env.JENKINS_USER;
    this.token = process.env.JENKINS_TOKEN;
    
    if (!this.baseURL || !this.username || !this.token) {
      console.warn('⚠️  Jenkins credentials not configured. Using mock data.');
      this.useMockData = true;
    } else {
      this.api = axios.create({
        baseURL: `${this.baseURL}/api/json`,
        auth: {
          username: this.username,
          token: this.token
        },
        timeout: 10000
      });
      this.useMockData = false;
    }
  }

  async getPipelineStatus() {
    if (this.useMockData) {
      return this.getMockPipelines();
    }

    try {
      const response = await this.api.get('?tree=jobs[name,color,url,lastBuild[number,result,timestamp,duration]]');
      const jobs = response.data.jobs || [];
      
      return jobs.map(job => {
        const build = job.lastBuild;
        const stages = this.parsePipelineStages(job);
        
        return {
          name: job.name,
          url: job.url,
          status: this.mapColorToStatus(job.color),
          stages: stages,
          lastBuild: build ? {
            number: build.number,
            result: build.result,
            timestamp: build.timestamp,
            duration: build.duration
          } : null
        };
      });
    } catch (error) {
      console.error('Jenkins API error:', error.message);
      // Fallback to mock data on error
      return this.getMockPipelines();
    }
  }

  async getPipelineDetails(jobName) {
    if (this.useMockData) {
      return this.getMockPipelineDetails(jobName);
    }

    try {
      const response = await this.api.get(`job/${encodeURIComponent(jobName)}/api/json?tree=description,lastBuild[number,result,timestamp,duration,stages[name,status]]`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch pipeline details: ${error.message}`);
    }
  }

  async getBuildHistory(limit = 50) {
    if (this.useMockData) {
      return this.getMockBuildHistory(limit);
    }

    try {
      // Get all jobs first
      const jobsResponse = await this.api.get('?tree=jobs[name]');
      const jobs = jobsResponse.data.jobs || [];
      
      // Get build history from all jobs
      const allBuilds = [];
      for (const job of jobs.slice(0, 10)) { // Limit to first 10 jobs
        try {
          const buildResponse = await this.api.get(
            `job/${encodeURIComponent(job.name)}/api/json?tree=builds[number,result,timestamp,duration]`
          );
          const builds = buildResponse.data.builds || [];
          builds.forEach(build => {
            allBuilds.push({
              name: job.name,
              number: build.number,
              result: build.result,
              timestamp: build.timestamp,
              duration: build.duration
            });
          });
        } catch (err) {
          console.warn(`Failed to get builds for ${job.name}:`, err.message);
        }
      }

      // Sort by timestamp and limit
      return allBuilds
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Jenkins API error:', error.message);
      return this.getMockBuildHistory(limit);
    }
  }

  async getBuildDetails(jobName, buildNumber) {
    if (this.useMockData) {
      return this.getMockBuildDetails(jobName, buildNumber);
    }

    try {
      const response = await this.api.get(
        `job/${encodeURIComponent(jobName)}/${buildNumber}/api/json?tree=result,timestamp,duration,stages[name,status]`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch build details: ${error.message}`);
    }
  }

  async triggerBuild(jobName) {
    if (this.useMockData) {
      return { message: 'Mock build triggered', jobName };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/job/${encodeURIComponent(jobName)}/build`,
        {},
        {
          auth: {
            username: this.username,
            password: this.token
          },
          headers: {
            'Jenkins-Crumb': await this.getCrumb()
          }
        }
      );
      return { message: 'Build triggered successfully', jobName };
    } catch (error) {
      throw new Error(`Failed to trigger build: ${error.message}`);
    }
  }

  async getCrumb() {
    try {
      const response = await axios.get(
        `${this.baseURL}/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,":",//crumb)`,
        {
          auth: {
            username: this.username,
            password: this.token
          }
        }
      );
      return response.data.split(':')[1];
    } catch (error) {
      return '';
    }
  }

  mapColorToStatus(color) {
    if (!color) return 'NOT_BUILT';
    if (color.includes('blue')) return 'SUCCESS';
    if (color.includes('red')) return 'FAILURE';
    if (color.includes('yellow')) return 'UNSTABLE';
    if (color.includes('aborted')) return 'ABORTED';
    if (color.includes('notbuilt')) return 'NOT_BUILT';
    if (color.includes('blue_anime') || color.includes('red_anime') || color.includes('yellow_anime')) {
      return 'RUNNING';
    }
    return 'UNKNOWN';
  }

  parsePipelineStages(job) {
    // This is a simplified parser - real implementation would fetch stage details
    // For now, return mock stages based on job status
    const status = this.mapColorToStatus(job.color);
    return [
      { name: 'Checkout', status: status },
      { name: 'Build', status: status },
      { name: 'Test', status: status },
      { name: 'Deploy', status: status }
    ];
  }

  // Mock data for development/testing
  getMockPipelines() {
    const statuses = ['SUCCESS', 'FAILURE', 'RUNNING', 'UNSTABLE'];
    const pipelineNames = [
      'frontend-deploy',
      'backend-api',
      'database-migration',
      'integration-tests',
      'production-release'
    ];

    return pipelineNames.map((name, index) => {
      const status = statuses[index % statuses.length];
      return {
        name,
        url: `http://jenkins.example.com/job/${name}`,
        status,
        stages: [
          { name: 'Checkout', status },
          { name: 'Build', status },
          { name: 'Test', status },
          { name: 'Deploy', status }
        ],
        lastBuild: {
          number: 42 + index,
          result: status === 'RUNNING' ? null : status,
          timestamp: Date.now() - (index * 3600000),
          duration: (5 + index) * 60000
        }
      };
    });
  }

  getMockPipelineDetails(jobName) {
    return {
      name: jobName,
      description: `Mock pipeline for ${jobName}`,
      lastBuild: {
        number: 42,
        result: 'SUCCESS',
        timestamp: Date.now(),
        duration: 300000
      }
    };
  }

  getMockBuildHistory(limit) {
    const results = ['SUCCESS', 'FAILURE', 'UNSTABLE', 'SUCCESS'];
    const names = ['frontend-deploy', 'backend-api', 'database-migration', 'integration-tests'];
    
    return Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      name: names[i % names.length],
      number: 100 - i,
      result: results[i % results.length],
      timestamp: Date.now() - (i * 1800000), // 30 min intervals
      duration: (5 + (i % 10)) * 60000
    }));
  }

  getMockBuildDetails(jobName, buildNumber) {
    return {
      jobName,
      buildNumber: parseInt(buildNumber),
      result: 'SUCCESS',
      timestamp: Date.now(),
      duration: 300000,
      stages: [
        { name: 'Checkout', status: 'SUCCESS' },
        { name: 'Build', status: 'SUCCESS' },
        { name: 'Test', status: 'SUCCESS' },
        { name: 'Deploy', status: 'SUCCESS' }
      ]
    };
  }
}

module.exports = new JenkinsService();

