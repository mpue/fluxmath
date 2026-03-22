import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { getCategories, getTopicsByCategory } from '../topics/TopicRegistry';

export const TopicNav: React.FC = () => {
  const categories = getCategories();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        className={`hamburger${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Menü"
      >
        <span /><span /><span />
      </button>

      {open && <div className="nav-overlay" onClick={close} />}

      <nav className={`topic-nav${open ? ' show' : ''}`}>
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} onClick={close}>
          Home
        </NavLink>
        {categories.map(cat => {
          const topics = getTopicsByCategory(cat);
          return (
            <React.Fragment key={cat}>
              {categories.length > 1 && (
                <div className="nav-category">{cat}</div>
              )}
              {topics.map(topic => (
                <NavLink
                  key={topic.id}
                  to={`/topic/${topic.id}`}
                  className={({ isActive }) => isActive ? 'active' : ''}
                  onClick={close}
                >
                  {topic.icon} {topic.title} {topic.titleAccent}
                </NavLink>
              ))}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
};
