// Line chart — mirrors web PostsPerMonth.jsx but uses react-native-svg instead of D3 DOM.
// D3 is used only for its math (scaleBand, scaleLinear, line generator).
import { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { G, Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import * as d3 from 'd3';

const MARGIN = { top: 24, right: 16, bottom: 48, left: 36 };
const COLOR   = '#4a6cf7';

export default function PostsPerMonthChart({ data = [] }) {
  const { width: screenW } = useWindowDimensions();
  const W = screenW - 32;
  const H = 220;
  const iW = W - MARGIN.left - MARGIN.right;
  const iH = H - MARGIN.top - MARGIN.bottom;

  const { x, y, linePath, dots, xLabels, yTicks } = useMemo(() => {
    if (!data.length) return {};

    const x = d3.scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, iW])
      .padding(0.1);

    const maxY = d3.max(data, (d) => d.count) || 1;
    const y = d3.scaleLinear().domain([0, maxY]).nice().range([iH, 0]);

    const lineGen = d3.line()
      .x((d) => x(d.label) + x.bandwidth() / 2)
      .y((d) => y(d.count))
      .curve(d3.curveMonotoneX);

    const linePath = lineGen(data);
    const dots = data.map((d) => ({
      cx: x(d.label) + x.bandwidth() / 2,
      cy: y(d.count),
      label: d.label,
      count: d.count,
    }));

    // Show at most 6 x-axis labels to avoid clutter
    const step = Math.ceil(data.length / 6);
    const xLabels = data
      .filter((_, i) => i % step === 0)
      .map((d) => ({ x: x(d.label) + x.bandwidth() / 2, label: d.label }));

    const yTicks = y.ticks(5).map((v) => ({ y: y(v), v }));

    return { x, y, linePath, dots, xLabels, yTicks };
  }, [data, iW, iH]);

  if (!data.length) return <Text style={s.loading}>Loading chart…</Text>;

  return (
    <View>
      <Text style={s.title}>Posts per month</Text>
      <Svg width={W} height={H}>
        <G x={MARGIN.left} y={MARGIN.top}>
          {/* Y grid lines + tick labels */}
          {yTicks?.map(({ y: yPos, v }) => (
            <G key={v}>
              <Line x1={0} y1={yPos} x2={iW} y2={yPos} stroke="#e5e7eb" strokeWidth={1} />
              <SvgText x={-6} y={yPos + 4} fontSize={10} fill="#9ca3af" textAnchor="end">{v}</SvgText>
            </G>
          ))}

          {/* X axis labels */}
          {xLabels?.map(({ x: xPos, label }) => (
            <SvgText key={label} x={xPos} y={iH + 16} fontSize={9} fill="#9ca3af" textAnchor="middle">
              {label.slice(0, 6)}
            </SvgText>
          ))}

          {/* Line */}
          {linePath && (
            <Path d={linePath} stroke={COLOR} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
          )}

          {/* Dots */}
          {dots?.map(({ cx, cy, label }) => (
            <Circle key={label} cx={cx} cy={cy} r={4} fill={COLOR} />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  loading: { color: '#9ca3af', textAlign: 'center', paddingVertical: 40 },
});
