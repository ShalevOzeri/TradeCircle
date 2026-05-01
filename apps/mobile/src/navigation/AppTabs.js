import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import FeedScreen        from '../screens/feed/FeedScreen';
import GroupsScreen      from '../screens/groups/GroupsScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import MarketScreen      from '../screens/market/MarketScreen';
import ProfileScreen     from '../screens/profile/ProfileScreen';
import InboxScreen       from '../screens/messages/InboxScreen';
import ChatScreen        from '../screens/messages/ChatScreen';
import StatsScreen       from '../screens/stats/StatsScreen';

const Tab = createBottomTabNavigator();
const GroupStack   = createNativeStackNavigator();
const MessageStack = createNativeStackNavigator();

function GroupsStack() {
  return (
    <GroupStack.Navigator>
      <GroupStack.Screen name="GroupsList"   component={GroupsScreen}      options={{ title: 'Groups' }} />
      <GroupStack.Screen name="GroupDetail"  component={GroupDetailScreen} options={{ title: 'Group' }} />
    </GroupStack.Navigator>
  );
}

function MessagesStack() {
  return (
    <MessageStack.Navigator>
      <MessageStack.Screen name="Inbox" component={InboxScreen} options={{ title: 'Messages' }} />
      <MessageStack.Screen name="Chat"  component={ChatScreen}  options={{ title: '' }} />
    </MessageStack.Navigator>
  );
}

const TAB_ICONS = { Feed: '🏠', Groups: '👥', Market: '📈', Stats: '📊', Messages: '💬', Profile: '👤' };

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name]}</Text>,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Feed"     component={FeedScreen} />
      <Tab.Screen name="Groups"   component={GroupsStack} />
      <Tab.Screen name="Market"   component={MarketScreen} />
      <Tab.Screen name="Stats"    component={StatsScreen} />
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}
