import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getPostsPerMonth } from "../../services/api";

export default function PostsPerMonth({ groupId = null, months = 12 }) {
  const svgRef = useRef(null);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPostsPerMonth({ groupId, months })
      .done(res => setData(res.data))
      .fail(() => setError("Failed to load statistics"));
  }, [groupId, months]);

  useEffect(() => {
    if (!data.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600, height = 300;
    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(data.map(d => d.label)).range([0, innerW]).padding(0.1);
    const maxY = d3.max(data, d => d.count) || 1;
    const y = d3.scaleLinear().domain([0, maxY]).nice().range([innerH, 0]);

    g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x))
      .selectAll("text").attr("transform", "rotate(-35)").style("text-anchor", "end");
    g.append("g").call(d3.axisLeft(y).ticks(Math.min(maxY, 8)).tickFormat(d3.format("d")));

    svg.append("text").attr("x", width / 2).attr("y", 20).attr("text-anchor", "middle")
      .style("font-size", "14px").style("font-weight", "bold")
      .text(groupId ? "Posts in group per month" : "Total posts per month");

    const line = d3.line()
      .x(d => x(d.label) + x.bandwidth() / 2)
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    g.append("path").datum(data)
      .attr("fill", "none").attr("stroke", "#4a6cf7").attr("stroke-width", 2.5).attr("d", line);

    const tooltip = d3.select("body").append("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute").style("background", "rgba(0,0,0,0.8)")
      .style("color", "#fff").style("padding", "6px 10px").style("border-radius", "4px")
      .style("pointer-events", "none").style("opacity", 0).style("font-size", "12px");

    g.selectAll(".dot").data(data).enter().append("circle")
      .attr("cx", d => x(d.label) + x.bandwidth() / 2)
      .attr("cy", d => y(d.count)).attr("r", 4).attr("fill", "#4a6cf7")
      .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1)
          .html(`<b>${d.label}</b><br/>${d.count} posts`)
          .style("left", (event.pageX + 10) + "px")
          .style("top",  (event.pageY - 20) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    return () => tooltip.remove();
  }, [data, groupId]);

  if (error) return <div className="chart-error">{error}</div>;
  if (!data.length) return <div>Loading chart...</div>;
  return <svg ref={svgRef} style={{ width: "100%", maxWidth: 600 }} />;
}