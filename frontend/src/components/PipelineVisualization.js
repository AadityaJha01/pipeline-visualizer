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
      const yPosition = pipelineIndex * 120 + 60;
      
      // Pipeline name with better styling
      g.append('text')
        .attr('x', -15)
        .attr('y', yPosition)
        .attr('text-anchor', 'end')
        .attr('font-size', '15px')
        .attr('font-weight', '700')
        .attr('fill', '#1a202c')
        .attr('letter-spacing', '-0.3px')
        .style('cursor', 'pointer')
        .on('mouseenter', function() {
          d3.select(this)
            .attr('fill', '#667eea')
            .transition()
            .duration(200)
            .attr('font-size', '16px');
        })
        .on('mouseleave', function() {
          d3.select(this)
            .attr('fill', '#1a202c')
            .transition()
            .duration(200)
            .attr('font-size', '15px');
        })
        .text(pipeline.name);

      // Stages visualization
      const stages = pipeline.stages || [];
      const stageWidth = chartWidth / Math.max(stages.length, 1);
      
      stages.forEach((stage, stageIndex) => {
        const x = stageIndex * stageWidth;
        const stageColor = stageColors[stage.status] || stageColors['NOT_BUILT'];
        
        // Stage rectangle with enhanced styling
        const rect = g.append('rect')
          .attr('x', x)
          .attr('y', yPosition - 25)
          .attr('width', stageWidth - 12)
          .attr('height', 50)
          .attr('rx', 12)
          .attr('fill', stageColor)
          .attr('opacity', 0.9)
          .attr('stroke', 'rgba(255, 255, 255, 0.8)')
          .attr('stroke-width', 2.5)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))')
          .style('cursor', 'pointer')
          .on('mouseenter', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('opacity', 1)
              .attr('y', yPosition - 28)
              .attr('height', 56);
          })
          .on('mouseleave', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('opacity', 0.9)
              .attr('y', yPosition - 25)
              .attr('height', 50);
          });

        // Stage name with better visibility
        g.append('text')
          .attr('x', x + (stageWidth - 12) / 2)
          .attr('y', yPosition + 8)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('font-weight', '600')
          .attr('fill', '#fff')
          .attr('letter-spacing', '0.3px')
          .style('text-shadow', '0 1px 2px rgba(0, 0, 0, 0.2)')
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

        // Arrow between stages with subtle animation
        if (stageIndex < stages.length - 1) {
          const arrowLine = g.append('line')
            .attr('x1', x + stageWidth - 12)
            .attr('y1', yPosition)
            .attr('x2', x + stageWidth)
            .attr('y2', yPosition)
            .attr('stroke', '#cbd5e1')
            .attr('stroke-width', 3)
            .attr('marker-end', 'url(#arrowhead)')
            .style('opacity', 0.7);
          
          // Add subtle pulsing animation to arrows
          arrowLine
            .transition()
            .duration(1000)
            .style('opacity', 0.9)
            .transition()
            .duration(1000)
            .style('opacity', 0.7)
            .on('end', function repeat() {
              d3.select(this)
                .transition()
                .duration(1000)
                .style('opacity', 0.9)
                .transition()
                .duration(1000)
                .style('opacity', 0.7)
                .on('end', repeat);
            });
        }
      });

      // Overall status indicator with pulse animation
      const overallStatus = pipeline.status || 'NOT_BUILT';
      const statusCircle = g.append('circle')
        .attr('cx', -35)
        .attr('cy', yPosition)
        .attr('r', 10)
        .attr('fill', stageColors[overallStatus])
        .attr('opacity', overallStatus === 'RUNNING' ? 0.8 : 1)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))');
      
      if (overallStatus === 'RUNNING') {
        statusCircle
          .transition()
          .duration(750)
          .attr('r', 12)
          .transition()
          .duration(750)
          .attr('r', 10)
          .on('end', function repeat() {
            d3.select(this)
              .transition()
              .duration(750)
              .attr('r', 12)
              .transition()
              .duration(750)
              .attr('r', 10)
              .on('end', repeat);
          });
      }
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

