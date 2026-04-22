# TradeCircle - Requirements Document

## 1. Product Vision
TradeCircle is a social network for amateur investors and market enthusiasts. The product combines social interaction, real-time market awareness, and community-driven discussion around stocks, crypto assets, sectors, and trading themes.

## 2. Core Goals
- Show up-to-date market prices on the home page.
- Let users join communities that are tied to specific assets or trading topics.
- Allow posting, commenting, and discussion around market topics.
- Enforce strict access control so private data and admin actions are protected.
- Keep the product social, visual, and easy to follow for non-professional investors.

## 3. Functional Requirements

### 3.1 Home Page / Market Dashboard
- Display live or near-live quotes for stocks, crypto, indices, and sectors.
- Show daily change, trending assets, and top community discussions.
- Present watchlists or featured market collections.
- Surface recent posts related to the assets shown on the page.

### 3.2 Communities / Groups
- Each group must be linked to one of the following:
  - a specific stock,
  - a crypto asset,
  - a basket of stocks,
  - a market sector,
  - or a trading topic.
- Group pages must support posts, members, requests to join, approvals, and moderation.
- Private groups must be visible only to approved members.

### 3.3 Posts and Discussions
- Users can publish market ideas, charts, news, opinions, and polls.
- Posts can be associated with a market symbol or topic.
- Users can edit or delete only their own posts.
- Group admins can moderate content inside the groups they manage.

### 3.4 Search
- The system must support advanced search for posts and groups.
- Users must be able to filter by at least three parameters in each search flow.
- Search results should be relevant to market symbols, themes, time range, media type, and group visibility.

### 3.5 Permissions
- Authentication uses username and password.
- Users can only access their own private information.
- Group admins can approve join requests and manage members.
- Non-members cannot view posts in private groups.

## 4. Non-Functional Requirements
- The UI should feel modern, energetic, and finance-oriented.
- The application should remain responsive on desktop and mobile.
- Real-time updates should be supported for group activity and discussions.
- The system should be extensible for future market data APIs.

## 5. MVP Scope
1. Rebrand the app to TradeCircle.
2. Add a market dashboard to the home page.
3. Attach groups to market assets or trading topics.
4. Keep the current social features: feed, chat, profile pages, groups, search, and stats.
5. Preserve existing authorization and private group protections.

## 6. Suggested Delivery Phases

### Phase 1
- Rename UI and app title to TradeCircle.
- Add a market snapshot block on the home page.
- Prepare data structures for asset-linked groups.

### Phase 2
- Introduce dedicated asset pages for stocks and crypto symbols.
- Connect market quotes to an API.
- Add trending and watchlist behavior.

### Phase 3
- Add richer investor features: polls, reactions, alerts, and saved ideas.
- Improve analytics for users and groups.
- Add moderation and discovery tools.

## 7. Product Positioning
TradeCircle should feel like a hybrid of a social network, a market discussion hub, and a lightweight investment community platform.