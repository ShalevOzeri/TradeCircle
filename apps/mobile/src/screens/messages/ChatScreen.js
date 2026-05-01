import { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { getConversation } from '@tradecircle/api-client';
import { connectSocket, getSocket } from '@tradecircle/shared-hooks';
import { timeAgo, initials } from '@tradecircle/utils';
import { useAuth } from '../../context/AuthContext';
import { getCachedToken } from '../../services/tokenStorage';

export default function ChatScreen({ route, navigation }) {
  const { otherUser } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [theyTyping, setTheyTyping] = useState(false);
  const listRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    navigation.setOptions({ title: otherUser.fullName });

    const socket = connectSocket(getCachedToken) || getSocket();
    if (!socket) return;

    getConversation(otherUser._id)
      .then((res) => setMessages(res.messages || []))
      .catch(console.error)
      .finally(() => setLoading(false));

    socket.emit('message:read', { fromUserId: otherUser._id });

    const onNew = (msg) => {
      const relevant =
        (msg.from._id === otherUser._id && msg.to === user._id) ||
        (msg.from._id === user._id    && msg.to === otherUser._id);
      if (!relevant) return;
      setMessages((prev) => [...prev, msg]);
      if (msg.from._id === otherUser._id) {
        socket.emit('message:read', { fromUserId: otherUser._id });
      }
    };

    const onTypingStart = ({ from }) => { if (from === otherUser._id) setTheyTyping(true); };
    const onTypingStop  = ({ from }) => { if (from === otherUser._id) setTheyTyping(false); };

    socket.on('message:new', onNew);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop',  onTypingStop);

    return () => {
      socket.off('message:new', onNew);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop',  onTypingStop);
    };
  }, [otherUser._id, user._id]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('message:send', { to: otherUser._id, text: trimmed }, (res) => {
      if (!res?.ok) console.error('Send failed:', res?.error);
    });
    setText('');
    clearTimeout(typingTimer.current);
    socket.emit('typing:stop', { to: otherUser._id });
  };

  const handleTextChange = (val) => {
    setText(val);
    const socket = getSocket();
    if (!socket) return;
    socket.emit('typing:start', { to: otherUser._id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing:stop', { to: otherUser._id });
    }, 1500);
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#2563eb" size="large" /></View>;

  const renderItem = ({ item: msg }) => {
    const mine = msg.from._id === user._id;
    return (
      <View style={[s.msgRow, mine ? s.mine : s.theirs]}>
        {!mine && (
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials(msg.from?.fullName || '')}</Text>
          </View>
        )}
        <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs]}>
          <Text style={mine ? s.textMine : s.textTheirs}>{msg.text}</Text>
          <Text style={s.msgTime}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        style={s.list}
        data={messages}
        keyExtractor={(m) => m._id}
        renderItem={renderItem}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={{ padding: 12 }}
        ListFooterComponent={
          theyTyping ? (
            <View style={[s.msgRow, s.theirs]}>
              <View style={[s.bubble, s.bubbleTheirs]}>
                <Text style={s.textTheirs}>typing…</Text>
              </View>
            </View>
          ) : null
        }
      />

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={text}
          onChangeText={handleTextChange}
          placeholder="Type a message…"
          onSubmitEditing={send}
          returnKeyType="send"
          maxLength={1000}
        />
        <TouchableOpacity style={[s.sendBtn, !text.trim() && s.sendDisabled]} onPress={send} disabled={!text.trim()}>
          <Text style={s.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  msgRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  mine: { justifyContent: 'flex-end' },
  theirs: { justifyContent: 'flex-start' },
  avatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#6b7280',
    justifyContent: 'center', alignItems: 'center', marginRight: 6,
  },
  avatarText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 10 },
  bubbleMine: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#fff', borderBottomLeftRadius: 4, elevation: 1 },
  textMine: { color: '#fff', fontSize: 14 },
  textTheirs: { color: '#111827', fontSize: 14 },
  msgTime: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 3, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  input: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, fontSize: 15, marginRight: 8,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb',
    justifyContent: 'center', alignItems: 'center',
  },
  sendDisabled: { backgroundColor: '#d1d5db' },
  sendIcon: { color: '#fff', fontSize: 16 },
});
