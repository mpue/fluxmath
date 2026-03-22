import { ComponentType } from 'react';

export interface TopicMeta {
  id: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  icon: string;
  description: string;
  component: ComponentType;
  category?: string;          // default: 'Themen'
}

const topicRegistry: TopicMeta[] = [];

export function registerTopic(meta: TopicMeta): void {
  if (!topicRegistry.find(t => t.id === meta.id)) {
    topicRegistry.push(meta);
  }
}

export function getTopics(): ReadonlyArray<TopicMeta> {
  return topicRegistry;
}

export function getTopicById(id: string): TopicMeta | undefined {
  return topicRegistry.find(t => t.id === id);
}

/** Ordered list of known categories */
const CATEGORY_ORDER = ['Themen', 'Tools'];

export function getCategories(): string[] {
  const seen = new Set<string>();
  for (const t of topicRegistry) seen.add(t.category || 'Themen');
  return CATEGORY_ORDER.filter(c => seen.has(c));
}

export function getTopicsByCategory(cat: string): ReadonlyArray<TopicMeta> {
  return topicRegistry.filter(t => (t.category || 'Themen') === cat);
}
