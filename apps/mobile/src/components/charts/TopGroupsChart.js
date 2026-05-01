// Horizontal bar chart — mirrors web TopGroups.jsx but uses react-native-svg.
// D3 is used only for scale math, not for DOM manipulation.
import { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { G, Rect, Text as SvgText, Line } from 'react-native-svg';
import * as d3 from 'd3';

const MARGIN  = { top: 20, right: 80, bottom: 20, left: 110 };
const COLORS  = ['#4a6cf7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const ROW_H   = 34;

export default function TopGroupsChart({ data = [] }) {
  const { width: screenW } = useWindowDimensions();
  const W = screenW - 32;
  const H = MARGIN.top + data.length * ROW_H + MARGIN.bottom;
  const iW = W - MARGIN.left - MARGIN.right;
  const iH = H - MARGIN.top - MARGIN.bottom;

  const { x, y, bars } = useMemo(() => {
    if (!data.length) return {};

    const maxX = d3.max(data, (d) => d.postCount) || 1;
    const x = d3.scaleLinear().domain([0, maxX]).nice().range([0, iW]);
    const y = d3.scaleBand()
      .domain(data.map((d) => d.name))
      .range([0, iH])
      .padding(0.2);

    const categories = [...new Set(data.map((d) => d.category))];
    const colorScale = d3.scaleOrdinal().domain(categories).range(COLORS);

    const bars = data.map((d) => ({
      y: y(d.name),
      width: x(d.postCount),
      height: y.bandwidth(),
      fill: colorScale(d.category),
      name: d.name,
      postCount: d.postCount,
      memberCount: d.memberCount,
    }));

    return { x, y, bars };
  }, [data, iW, iH]);

  if (!data.length) return <Text style={s.loading}>Loading chart…</Text>;

  return (
    <View>
      <Text style={s.title}>Top groups by activity</Text>
      <Svg width={W} height={H}>
        <G x={MARGIN.left} y={MARGIN.top}>
          {/* Bars */}
          {bars?.map((b) => (
            <G key={b.name}>
              {/* Group name label (Y axis) */}
              <SvgText
                x={-8} y={b.y + b.height / 2 + 4}
                fontSize={10} fill="#374151" textAnchor="end"
              >
                {b.name.length > 14 ? b.name.slice(0, 13) + '…' : b.name}
              </SvgText>

              {/* Bar */}
              <Rect
                x={0} y={b.y} width={b.width || 0} height={b.height}
                fill={b.fill} rx={4}
              />

              {/* Value label */}
              <SvgText
                x={(b.width || 0) + 6} y={b.y + b.height / 2 + 4}
                fontSize={10} fill="#6b7280"
              >
                {b.postCount}
              </SvgText>
            </G>
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
