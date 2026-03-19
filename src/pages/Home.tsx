import React from 'react';
import { Link } from 'react-router-dom';
import { getTopics } from '../topics/TopicRegistry';
import { FunFacts } from '../components/FunFacts';

export const Home: React.FC = () => {
  const topics = getTopics();

  return (
    <>
      <div className="header-eyebrow">FluxMath <span>// Übersicht</span></div>
      <h1>Flux<em>Math</em></h1>
      <p className="subtitle">Interaktive Mathematik — wähle ein Thema</p>

      <FunFacts />

      <div className="home-grid">
        {topics.map(topic => (
          <Link key={topic.id} to={`/topic/${topic.id}`} className="home-card">
            <div className="card-icon">{topic.icon}</div>
            <div className="card-title">{topic.title} {topic.titleAccent}</div>
            <div className="card-desc">{topic.description}</div>
          </Link>
        ))}
      </div>
    </>
  );
};
