import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { getUser, getUserPosts } from '@tradecircle/api-client';
import { timeAgo, initials } from '@tradecircle/utils';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    Promise.all([
      getUser(user._id).then((r) => setProfile(r.user)),
      getUserPosts(user._id).then((r) => setPosts(r.posts || [])),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <View style={s.center}><ActivityIndicator color="#2563eb" size="large" /></View>;

  return (
    <FlatList
      style={s.list}
      data={posts}
      keyExtractor={(p) => p._id}
      ListHeaderComponent={
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials(profile?.fullName || '')}</Text>
          </View>
          <Text style={s.name}>{profile?.fullName}</Text>
          <Text style={s.username}>@{profile?.username}</Text>
          {profile?.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}
          <View style={s.stats}>
            <Text style={s.stat}>{posts.length} posts</Text>
            <Text style={s.stat}>{profile?.friends?.length ?? 0} friends</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutText}>Sign Out</Text>
          </TouchableOpacity>
          <Text style={s.sectionTitle}>My Posts</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={s.card}>
          <Text style={s.time}>{timeAgo(item.createdAt)}</Text>
          <Text style={s.content}>{item.content}</Text>
          <Text style={s.likes}>♥ {item.likes?.length ?? 0}</Text>
        </View>
      )}
      contentContainerStyle={{ padding: 12 }}
      ListEmptyComponent={<Text style={s.empty}>No posts yet.</Text>}
    />
  );
}

const s = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, elevation: 2 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  username: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  bio: { fontSize: 13, color: '#374151', marginTop: 8, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 24, marginTop: 12 },
  stat: { fontSize: 13, color: '#374151', fontWeight: '600' },
  logoutBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444' },
  logoutText: { color: '#ef4444', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 20, alignSelf: 'flex-start' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2 },
  time: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  content: { fontSize: 14, color: '#374151' },
  likes: { fontSize: 13, color: '#6b7280', marginTop: 8 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
});
