import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getTopicById } from '../topics/TopicRegistry';
import { recordVisit } from '../shared/AchievementStore';

export const TopicPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const topic = topicId ? getTopicById(topicId) : undefined;

  useEffect(() => {
    if (topicId) recordVisit(topicId);
  }, [topicId]);

  if (!topic) {
    return <Navigate to="/" replace />;
  }

  const TopicComponent = topic.component;
  return <TopicComponent />;
};
