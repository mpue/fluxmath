import { ComponentType } from 'react';

export interface TopicMeta {
  id: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  icon: string;
  description: string;
  component: ComponentType;
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
