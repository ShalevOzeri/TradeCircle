import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getTopGroups } from "../../services/api";

export default function TopGroups({ days = 30, limit = 10 }) {
  const svgRef = useRef(null);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTopGroups({ days, limit })
      .done(res => setData(res.data))
      .fail(() => setError("Failed to load statistics"));
  }, [days, limit]);

  useEffect(() => {
    if (!data.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600, height = 40 + data.length * 36;
    const margin = { top: 30, right: 60, bottom: 30, left: 140 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const maxX = d3.max(data, d => d.postCount) || 1;
    const x = d3.scaleLinear().domain([0, maxX]).nice().range([0, innerW]);
    const y = d3.scaleBand().domain(data.map(d => d.name)).range([0, innerH]).padding(0.15);

    g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d")));
    g.append("g").call(d3.axisLeft(y));

    svg.append("text").attr("x", width / 2).attr("y", 20).attr("text-anchor", "middle")
      .style("font-size", "14px").style("font-weight", "bold")
      .text(`Top groups by activity (last ${days} days)`);

    const categories = [...new Set(data.map(d => d.category))];
    const color = d3.scaleOrdinal().domain(categories).range(d3.schemeSet2);

    g.selectAll(".bar").data(data).enter().append("rect")
      .attr("y", d => y(d.name)).attr("height", y.bandwidth())
      .attr("x", 0).attr("width", 0)
      .attr("fill", d => color(d.category)).attr("rx", 4)
      .transition().duration(700).attr("width", d => x(d.postCount));

    g.selectAll(".label").data(data).enter().append("text")
      .attr("x", d => x(d.postCount) + 6)
      .attr("y", d => y(d.name) + y.bandwidth() / 2 + 4)
      .style("font-size", "12px").style("fill", "#333")
      .text(d => `${d.postCount} posts | ${d.memberCount} members`);
  }, [data, days]);

  if (error) return <div className="chart-error">{error}</div>;
  if (!data.length) return <div>Loading chart...</div>;
  return <svg ref={svgRef} style={{ width: "100%", maxWidth: 600 }} />;
}