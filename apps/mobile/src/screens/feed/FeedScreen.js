import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { getFeed, toggleLike } from '@tradecircle/api-client';
import { timeAgo, initials } from '@tradecircle/utils';
import { useAuth } from '../../context/AuthContext';

function PostMedia({ mediaType, mediaUrl }) {
  if (!mediaUrl || mediaType === 'none') return null;
  if (mediaType === 'image') {
    return <Image source={{ uri: mediaUrl }} style={styles.media} resizeMode="cover" />;
  }
  if (mediaType === 'video') {
    return (
      <Video
        source={{ uri: mediaUrl }}
        style={styles.media}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
      />
    );
  }
  return null;
}

function PostCard({ post, currentUserId, onLike }) {
  const liked = post.likes?.includes(currentUserId);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(post.author?.fullName || '')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>{post.author?.fullName}</Text>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.content}>{post.content}</Text>
      <PostMedia mediaType={post.mediaType} mediaUrl={post.mediaUrl} />

      {post.marketMentions?.length > 0 && (
        <View style={styles.mentions}>
          {post.marketMentions.map((sym) => (
            <View key={sym.symbol} style={styles.chip}>
              <Text style={styles.chipText}>{sym.symbol}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onLike(post._id)} style={styles.likeBtn}>
          <Text style={[styles.likeIcon, liked && styles.liked]}>♥</Text>
          <Text style={styles.likeCount}>{post.likes?.length ?? 0}</Text>
        </TouchableOpacity>
        <Text style={styles.commentCount}>💬 {post.comments?.length ?? 0}</Text>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getFeed();
      setPosts(res.posts || []);
    } catch (e) {
      console.error('Feed load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLike = async (id) => {
    await toggleLike(id);
    load();
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <FlatList
      style={styles.list}
      data={posts}
      keyExtractor={(p) => p._id}
      renderItem={({ item }) => (
        <PostCard post={item} currentUserId={user?._id} onLike={handleLike} />
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
      }
      ListEmptyComponent={<Text style={styles.empty}>No posts yet.</Text>}
      contentContainerStyle={{ paddingVertical: 12 }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 10,
    borderRadius: 12, padding: 14, shadowColor: '#000',
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  author: { fontWeight: '600', fontSize: 14, color: '#111827' },
  time: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  content: { fontSize: 15, color: '#374151', lineHeight: 22 },
  media: { width: '100%', height: 200, borderRadius: 8, marginTop: 10 },
  mentions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { backgroundColor: '#eff6ff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { color: '#2563eb', fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 16 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeIcon: { fontSize: 18, color: '#9ca3af' },
  liked: { color: '#ef4444' },
  likeCount: { fontSize: 13, color: '#6b7280' },
  commentCount: { fontSize: 13, color: '#6b7280' },
  empty: { textAlign: 'center', marginTop: 60, color: '#9ca3af', fontSize: 15 },
});
