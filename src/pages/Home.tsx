import React from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getTopicsByCategory } from '../topics/TopicRegistry';
import { FunFacts } from '../components/FunFacts';
import { getProgress } from '../shared/ProgressStore';
import { AchievementPanel } from '../components/AchievementPanel';

export const Home: React.FC = () => {
  const categories = getCategories();
  const progress = getProgress();

  return (
    <>
      <div className="header-eyebrow">FluxMath <span>// Übersicht</span></div>
      <h1>Flux<em>Math</em></h1>
      <p className="subtitle">Interaktive Mathematik — wähle ein Thema</p>

      <FunFacts />

      {categories.map(cat => {
        const topics = getTopicsByCategory(cat);
        return (
          <React.Fragment key={cat}>
            {categories.length > 1 && (
              <h2 className="home-section-title">{cat}</h2>
            )}
            <div className="home-grid">
              {topics.map(topic => {
                const tp = progress[topic.id];
                return (
                  <Link key={topic.id} to={`/topic/${topic.id}`} className="home-card">
                    <div className="card-icon">{topic.icon}</div>
                    <div className="card-title">{topic.title} {topic.titleAccent}</div>
                    <div className="card-desc">{topic.description}</div>
                    {tp && tp.total > 0 && (
                      <div className="card-progress">
                        <div className="card-progress-bar" style={{ width: `${tp.bestPct}%` }} />
                        <span className="card-progress-label">{tp.bestPct}% best</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </React.Fragment>
        );
      })}

      <h2 className="home-section-title">Achievements</h2>
      <AchievementPanel />
    </>
  );
};
