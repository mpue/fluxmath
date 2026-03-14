import React from 'react';
import { NavLink } from 'react-router-dom';
import { getTopics } from '../topics/TopicRegistry';

export const TopicNav: React.FC = () => {
  const topics = getTopics();

  return (
    <nav className="topic-nav">
      <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
        Home
      </NavLink>
      {topics.map(topic => (
        <NavLink
          key={topic.id}
          to={`/topic/${topic.id}`}
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          {topic.icon} {topic.title} {topic.titleAccent}
        </NavLink>
      ))}
    </nav>
  );
};
