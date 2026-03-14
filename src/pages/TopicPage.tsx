import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getTopicById } from '../topics/TopicRegistry';

export const TopicPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const topic = topicId ? getTopicById(topicId) : undefined;

  if (!topic) {
    return <Navigate to="/" replace />;
  }

  const TopicComponent = topic.component;
  return <TopicComponent />;
};
