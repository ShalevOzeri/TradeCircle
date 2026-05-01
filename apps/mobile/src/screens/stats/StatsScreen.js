import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { getPostsPerMonth, getTopGroups } from '@tradecircle/api-client';
import PostsPerMonthChart from '../../components/charts/PostsPerMonthChart';
import TopGroupsChart     from '../../components/charts/TopGroupsChart';

export default function StatsScreen() {
  const [monthData,  setMonthData]  = useState([]);
  const [groupData,  setGroupData]  = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      getPostsPerMonth({ months: 12 }).then((r) => setMonthData(r.data || [])),
      getTopGroups({ days: 30, limit: 8 }).then((r) => setGroupData(r.data || [])),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#2563eb" size="large" /></View>;

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <Text style={s.heading}>Network Statistics</Text>

      <View style={s.card}>
        <PostsPerMonthChart data={monthData} />
      </View>

      <View style={s.card}>
        <TopGroupsChart data={groupData} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 16, elevation: 2,
  },
});
