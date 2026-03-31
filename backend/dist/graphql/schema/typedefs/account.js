"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountTypeDefs = void 0;
exports.accountTypeDefs = `
  type SessionRecord {
    sessionId: String!
    userId: String!
    createdAt: String!
    lastSeenAt: String!
  }

  type SimpleResult {
    success: Boolean!
    message: String
  }

  type TokenResult {
    token: String!
  }

  type ForgotPasswordResult {
    message: String!
    resetToken: String
    resetUrl: String
    expiresIn: String
  }

  type MfaSetupResult {
    secret: String!
    otpauthUrl: String!
    expiresInSeconds: Int!
  }

  type MfaVerifyResult {
    enabled: Boolean!
  }

  type UserDocument {
    id: ID!
    userId: ID
    documentType: String
    docUrl: String
    status: String
    createdAt: String
  }

  type HostVerification {
    id: ID!
    userId: ID
    kycStatus: String
    taxId: String
    approvedAt: String
    createdAt: String
    updatedAt: String
    user: UserLite
  }

  type LoyaltyNextTierTarget {
    tier: String!
    staysRequired: Int!
    spendRequired: Float!
  }

  type PersonalizationSignals {
    searches: Int!
  }

  type LoyaltySummary {
    tier: String!
    benefits: [String!]!
    rewardPoints: Int!
    totalSpent: Float!
    completedStays: Int!
    nextTierTarget: LoyaltyNextTierTarget
    referralCode: String!
    personalizationSignals: PersonalizationSignals!
  }

  type IdentityChecks {
    governmentId: Boolean!
    addressProof: Boolean!
    selfieMatch: Boolean!
  }

  type IdentityDocument {
    id: ID!
    documentType: String!
    status: String
    createdAt: String
  }

  type IdentityVerification {
    userId: ID!
    stage: String!
    checks: IdentityChecks!
    requiredActions: [String!]!
    documents: [IdentityDocument!]!
  }`;
