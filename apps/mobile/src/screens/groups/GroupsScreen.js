import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { listGroups } from '@tradecircle/api-client';

export default function GroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listGroups()
      .then((res) => setGroups(res.groups || []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#2563eb" size="large" /></View>;

  return (
    <FlatList
      style={s.list}
      data={groups}
      keyExtractor={(g) => g._id}
      renderItem={({ item }) => (
        <TouchableOpacity style={s.card} onPress={() => navigation.navigate('GroupDetail', { groupId: item._id })}>
          <Text style={s.name}>{item.name}</Text>
          <Text style={s.desc} numberOfLines={2}>{item.description}</Text>
          <Text style={s.meta}>{item.members?.length ?? 0} members · {item.privacy}</Text>
        </TouchableOpacity>
      )}
      contentContainerStyle={{ padding: 12 }}
      ListEmptyComponent={<Text style={s.empty}>No groups found.</Text>}
    />
  );
}

const s = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  desc: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  meta: { fontSize: 12, color: '#9ca3af' },
  empty: { textAlign: 'center', marginTop: 60, color: '#9ca3af' },
});
