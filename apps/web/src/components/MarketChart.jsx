import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { formatPrice as fmtPrice } from "@tradecircle/utils";

function draw(el, data) {
  const svg = d3.select(el);
  svg.selectAll("*").remove();

  const W = el.getBoundingClientRect().width || 520;
  const H = 240;
  const m = { top: 16, right: 16, bottom: 38, left: 66 };
  const w = W - m.left - m.right;
  const h = H - m.top  - m.bottom;

  svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const parsed = data.map(d => ({ date: new Date(d.date), close: d.close }));
  const xScale = d3.scaleTime().domain(d3.extent(parsed, d => d.date)).range([0, w]);
  const [minY, maxY] = d3.extent(parsed, d => d.close);
  const pad = (maxY - minY) * 0.08 || maxY * 0.02 || 1;
  const yScale = d3.scaleLinear().domain([minY - pad, maxY + pad]).range([h, 0]);

  const isUp = parsed[parsed.length - 1].close >= parsed[0].close;
  const lineColor = isUp ? "#16a34a" : "#dc2626";

  // Subtle grid
  g.append("g")
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-w).tickFormat(""))
    .call(gg => gg.select(".domain").remove())
    .call(gg => gg.selectAll("line").attr("stroke", "rgba(0,0,0,0.05)"));

  // Area fill
  g.append("path").datum(parsed)
    .attr("fill", isUp ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)")
    .attr("d", d3.area().x(d => xScale(d.date)).y0(h).y1(d => yScale(d.close)).curve(d3.curveMonotoneX));

  // Price line
  g.append("path").datum(parsed)
    .attr("fill", "none").attr("stroke", lineColor).attr("stroke-width", 2)
    .attr("d", d3.line().x(d => xScale(d.date)).y(d => yScale(d.close)).curve(d3.curveMonotoneX));

  // X axis
  g.append("g").attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(xScale).ticks(Math.min(parsed.length, 6))
      .tickFormat(d3.timeFormat(parsed.length > 60 ? "%b '%y" : "%b %d")))
    .call(gg => gg.select(".domain").attr("stroke", "rgba(0,0,0,0.1)"))
    .selectAll("text").style("font-size", "11px").attr("fill", "#6b7280");

  // Y axis
  g.append("g")
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(v => fmtPrice(v)))
    .call(gg => gg.select(".domain").remove())
    .selectAll("text").style("font-size", "11px").attr("fill", "#6b7280");

  // Tooltip overlay
  const tipEl = d3.select(el.parentNode).select(".chart-tip");
  const tip = tipEl.empty()
    ? d3.select(el.parentNode).append("div").attr("class", "chart-tip")
        .style("position","absolute").style("pointer-events","none").style("opacity",0)
        .style("background","var(--surface,#fff)").style("border","1.5px solid var(--border,#e5e7eb)")
        .style("border-radius","8px").style("padding","6px 10px").style("font-size","12px")
        .style("box-shadow","0 4px 16px rgba(0,0,0,0.12)").style("z-index","200")
        .style("white-space","nowrap")
    : tipEl;

  const bisect = d3.bisector(d => d.date).left;
  const vLine  = g.append("line").attr("y1",0).attr("y2",h).attr("stroke","#9ca3af").attr("stroke-width",1).attr("stroke-dasharray","4,2").style("opacity",0);
  const dot    = g.append("circle").attr("r",4).attr("fill",lineColor).attr("stroke","#fff").attr("stroke-width",2).style("opacity",0);

  g.append("rect").attr("width",w).attr("height",h).attr("fill","none").attr("pointer-events","all")
    .on("mousemove", function(event) {
      const [mx] = d3.pointer(event);
      const i = Math.min(bisect(parsed, xScale.invert(mx), 1), parsed.length - 1);
      const d = parsed[i];
      vLine.attr("x1", xScale(d.date)).attr("x2", xScale(d.date)).style("opacity", 1);
      dot.attr("cx", xScale(d.date)).attr("cy", yScale(d.close)).style("opacity", 1);
      const svgRect = el.getBoundingClientRect();
      tip.style("opacity", 1)
        .style("left", `${event.clientX - svgRect.left + 14}px`)
        .style("top",  `${event.clientY - svgRect.top  - 44}px`)
        .html(`<b>${d3.timeFormat("%b %d, %Y")(d.date)}</b><br/>${fmtPrice(d.close)}`);
    })
    .on("mouseleave", () => { vLine.style("opacity",0); dot.style("opacity",0); tip.style("opacity",0); });
}

export default function MarketChart({ data }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length < 2 || !svgRef.current) return;
    // Use rAF so the browser has measured the element before D3 reads clientWidth
    const raf = requestAnimationFrame(() => {
      if (svgRef.current) draw(svgRef.current, data);
    });
    return () => cancelAnimationFrame(raf);
  }, [data]);

  if (!data || data.length < 2)
    return <div style={{ textAlign:"center", padding:"50px 0", color:"var(--muted)" }}>No historical data available</div>;

  return <svg ref={svgRef} style={{ width:"100%", display:"block" }} height={240} />;
}
