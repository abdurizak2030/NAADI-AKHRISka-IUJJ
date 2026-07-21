/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  studentId?: string;
  department?: string;
  avatarUrl?: string;
  bio?: string;
  title?: string;
  achievements: Achievement[];
  createdAt: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: string;
  icon: string;
}

export type ArticleStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED';

export interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  authorName: string;
  authorId: string;
  category: string; // e.g. "Islamic Literature", "Somali History", "Analytical Reading"
  language: 'Somali' | 'Arabic' | 'English';
  status: ArticleStatus;
  publishedAt?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  imageUrl?: string;
}

export interface Comment {
  id: string;
  articleId: string;
  authorName: string;
  authorId: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
}

export interface PdfBook {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  coverUrl: string;
  downloadUrl: string;
  pagesCount: number;
  language: string;
  createdAt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  youtubeId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: string;
  speaker: string;
  createdAt: string;
}

export interface RoadmapNode {
  id: string;
  step: number;
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED';
  quarter: string;
}

export interface RoadmapProgress {
  startDate: string;
  endDate: string;
  completionPercentage: number;
  remainingDays: number;
  elapsedDays: number;
  totalDays: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  userTitle?: string;
  avatarUrl?: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  createdAt: string;
}

export type EventVisibility = 'PUBLIC' | 'PRIVATE';

export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  speaker?: string;
  image?: string;
  visibility: EventVisibility;
  status: 'UPCOMING' | 'COMPLETED';
  registeredMembers: string[]; // list of user emails
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatarUrl: string;
}

export interface FounderSocialLink {
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'email' | 'website';
  url: string;
}

export interface FounderInfo {
  name: string;
  title: string;
  bio: string;
  imageUrl: string;
  message: string;
  /** Optional — not all deployments populate social links for the founder. */
  socials?: FounderSocialLink[];
}

export interface MemberOfMonth {
  name: string;
  avatarUrl: string;
  achievement: string;
  bio: string;
  month: string;
}

export interface ClubSettings {
  clubName: string;
  clubArabicName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  whatsappChannelUrl?: string;
  whatsappGroupUrl?: string;
  telegramChannelUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  xUrl?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

// NOTE: Every collection above is backed by its own normalized table in
// Neon PostgreSQL — see /database.sql at the project root (canonical,
// human-run reference) and backend/src/db/schema.ts (idempotent runtime
// bootstrap). There is no JSONB "blob" store anymore.

