import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './PipelineVisualization.css';

const PipelineVisualization = ({ pipelines, loading }) => {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (loading || !pipelines.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = containerRef.current;
    const width = container.offsetWidth - 40;
    const height = Math.max(400, pipelines.length * 120);

    svg.attr('width', width).attr('height', height);

    const stageColors = {
      'SUCCESS': '#10b981',
      'FAILURE': '#ef4444',
      'UNSTABLE': '#f59e0b',
      'RUNNING': '#3b82f6',
      'ABORTED': '#6b7280',
      'NOT_BUILT': '#9ca3af'
    };

    const margin = { top: 20, right: 20, bottom: 20, left: 200 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    pipelines.forEach((pipeline, pipelineIndex) => {
      const yPosition = pipelineIndex * 110 + 50;
      
      // Pipeline name
      g.append('text')
        .attr('x', -10)
        .attr('y', yPosition)
        .attr('text-anchor', 'end')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .attr('fill', '#1a202c')
        .text(pipeline.name);

      // Stages visualization
      const stages = pipeline.stages || [];
      const stageWidth = chartWidth / Math.max(stages.length, 1);
      
      stages.forEach((stage, stageIndex) => {
        const x = stageIndex * stageWidth;
        const stageColor = stageColors[stage.status] || stageColors['NOT_BUILT'];
        
        // Stage rectangle
        const rect = g.append('rect')
          .attr('x', x)
          .attr('y', yPosition - 20)
          .attr('width', stageWidth - 10)
          .attr('height', 40)
          .attr('rx', 8)
          .attr('fill', stageColor)
          .attr('opacity', 0.8)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);

        // Stage name
        g.append('text')
          .attr('x', x + (stageWidth - 10) / 2)
          .attr('y', yPosition + 5)
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('font-weight', '500')
          .attr('fill', '#fff')
          .text(stage.name);

        // Animation for running stages
        if (stage.status === 'RUNNING') {
          rect.transition()
            .duration(1000)
            .attr('opacity', 0.5)
            .transition()
            .duration(1000)
            .attr('opacity', 0.8)
            .on('end', function repeat() {
              d3.select(this)
                .transition()
                .duration(1000)
                .attr('opacity', 0.5)
                .transition()
                .duration(1000)
                .attr('opacity', 0.8)
                .on('end', repeat);
            });
        }

        // Arrow between stages
        if (stageIndex < stages.length - 1) {
          g.append('line')
            .attr('x1', x + stageWidth - 10)
            .attr('y1', yPosition)
            .attr('x2', x + stageWidth)
            .attr('y2', yPosition)
            .attr('stroke', '#94a3b8')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrowhead)');
        }
      });

      // Overall status indicator
      const overallStatus = pipeline.status || 'NOT_BUILT';
      g.append('circle')
        .attr('cx', -30)
        .attr('cy', yPosition)
        .attr('r', 8)
        .attr('fill', stageColors[overallStatus])
        .attr('opacity', overallStatus === 'RUNNING' ? 0.7 : 1);
    });

    // Arrow marker definition
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#94a3b8');

  }, [pipelines, loading]);

  if (loading && !pipelines.length) {
    return (
      <div className="pipeline-viz-card">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading pipelines...</p>
        </div>
      </div>
    );
  }

  if (!pipelines.length) {
    return (
      <div className="pipeline-viz-card">
        <div className="empty-state">
          <p>No pipelines found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pipeline-viz-card" ref={containerRef}>
      <h2 className="card-title">Pipeline Status</h2>
      <svg ref={svgRef} className="pipeline-svg"></svg>
      <div className="legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#10b981' }}></span>
          <span>Success</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#ef4444' }}></span>
          <span>Failure</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#f59e0b' }}></span>
          <span>Unstable</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#3b82f6' }}></span>
          <span>Running</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#6b7280' }}></span>
          <span>Aborted</span>
        </div>
      </div>
    </div>
  );
};

export default PipelineVisualization;

