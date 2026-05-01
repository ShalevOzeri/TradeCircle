import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getMarketQuotes } from '@tradecircle/api-client';
import { formatPrice } from '@tradecircle/utils';

export default function MarketScreen() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketQuotes()
      .then((res) => setQuotes(res.quotes || []))
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#2563eb" size="large" /></View>;

  return (
    <FlatList
      style={s.list}
      data={quotes}
      keyExtractor={(q) => q.symbol}
      renderItem={({ item }) => {
        const up = item.change >= 0;
        return (
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.symbol}>{item.symbol}</Text>
              <Text style={s.name}>{item.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.price}>{formatPrice(item.price)}</Text>
              <Text style={[s.change, up ? s.up : s.down]}>
                {up ? '+' : ''}{item.change?.toFixed(2)}%
              </Text>
            </View>
          </View>
        );
      }}
      contentContainerStyle={{ padding: 12 }}
      ListEmptyComponent={<Text style={s.empty}>No market data.</Text>}
    />
  );
}

const s = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2 },
  symbol: { fontSize: 15, fontWeight: '700', color: '#111827' },
  name: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  price: { fontSize: 15, fontWeight: '600', color: '#111827' },
  change: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  up: { color: '#16a34a' },
  down: { color: '#dc2626' },
  empty: { textAlign: 'center', marginTop: 60, color: '#9ca3af' },
});
