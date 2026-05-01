import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { getInbox } from '@tradecircle/api-client';
import { timeAgo, initials } from '@tradecircle/utils';
import { useAuth } from '../../context/AuthContext';

export default function InboxScreen({ navigation }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInbox()
      .then((res) => setConversations(res.conversations || []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#2563eb" size="large" /></View>;

  return (
    <FlatList
      style={s.list}
      data={conversations}
      keyExtractor={(c) => c.user._id}
      renderItem={({ item }) => {
        const other = item.user;
        const last = item.lastMessage;
        const unread = item.unreadCount > 0;
        return (
          <TouchableOpacity
            style={s.row}
            onPress={() => navigation.navigate('Chat', { otherUser: other })}
          >
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials(other.fullName || '')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.rowTop}>
                <Text style={[s.name, unread && s.bold]}>{other.fullName}</Text>
                {last && <Text style={s.time}>{timeAgo(last.createdAt)}</Text>}
              </View>
              {last && (
                <Text style={[s.preview, unread && s.bold]} numberOfLines={1}>
                  {last.from === user._id ? 'You: ' : ''}{last.text}
                </Text>
              )}
            </View>
            {unread && <View style={s.badge}><Text style={s.badgeText}>{item.unreadCount}</Text></View>}
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={<Text style={s.empty}>No messages yet.</Text>}
      contentContainerStyle={{ padding: 12 }}
    />
  );
}

const s = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 12, marginBottom: 8, elevation: 2,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#2563eb',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name: { fontSize: 15, color: '#111827' },
  bold: { fontWeight: '700' },
  time: { fontSize: 11, color: '#9ca3af' },
  preview: { fontSize: 13, color: '#6b7280' },
  badge: {
    backgroundColor: '#2563eb', borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 60, color: '#9ca3af', fontSize: 15 },
});
