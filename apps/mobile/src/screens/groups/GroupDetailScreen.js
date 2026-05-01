import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getGroup, getGroupPosts } from '@tradecircle/api-client';
import { timeAgo, initials } from '@tradecircle/utils';

export default function GroupDetailScreen({ route }) {
  const { groupId } = route.params;
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getGroup(groupId).then((r) => setGroup(r.group)),
      getGroupPosts(groupId).then((r) => setPosts(r.posts || [])),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return <View style={s.center}><ActivityIndicator color="#2563eb" size="large" /></View>;

  return (
    <FlatList
      style={s.list}
      data={posts}
      keyExtractor={(p) => p._id}
      ListHeaderComponent={
        group ? (
          <View style={s.header}>
            <Text style={s.name}>{group.name}</Text>
            <Text style={s.desc}>{group.description}</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={s.card}>
          <Text style={s.author}>{item.author?.fullName}</Text>
          <Text style={s.time}>{timeAgo(item.createdAt)}</Text>
          <Text style={s.content}>{item.content}</Text>
        </View>
      )}
      contentContainerStyle={{ padding: 12 }}
    />
  );
}

const s = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#1e3a5f', borderRadius: 12, padding: 16, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  desc: { fontSize: 13, color: '#93c5fd', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  author: { fontWeight: '600', fontSize: 14, color: '#111827' },
  time: { fontSize: 12, color: '#9ca3af', marginBottom: 6 },
  content: { fontSize: 14, color: '#374151' },
});
