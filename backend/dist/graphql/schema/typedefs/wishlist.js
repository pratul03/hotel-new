"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistTypeDefs = void 0;
exports.wishlistTypeDefs = `
  type WishlistItem {
    id: ID!
    userId: ID
    roomId: ID
    listName: String
    addedAt: String
    room: Room
  }

  type WishlistCollection {
    name: String!
    count: Int!
  }

  type WishlistShareLink {
    shareCode: String!
    shareUrl: String!
    listName: String!
  }

  type WishlistInvitee {
    id: ID
    email: String
    name: String
  }

  type WishlistInviteCreateResult {
    inviteId: ID!
    shareCode: String!
    invitee: WishlistInvitee
    permission: String!
  }

  type WishlistInvite {
    id: ID!
    read: Boolean!
    createdAt: String
    ownerId: ID
    listName: String
    shareCode: String
    permission: String!
  }

  type WishlistAcceptResult {
    accepted: Boolean!
    importedItems: Int!
    listName: String!
    permission: String!
  }

  type SharedWishlist {
    owner: UserLite
    listName: String!
    items: [WishlistItem!]!
  }`;
