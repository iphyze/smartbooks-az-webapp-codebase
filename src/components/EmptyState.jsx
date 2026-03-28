import React from 'react';
import useThemeStore from '../stores/useThemeStore';

const EmptyState = () => {  
  const { theme } = useThemeStore();

  return(
    <div className={`empty-state theme-${theme}`}>
      <div className="empty-state-content">
        <span className="fas fa-chart-bar empty-state-icon"></span>
        <p className="empty-state-text">No data available</p>
        <p className="empty-state-subtext">Try selecting a different time period</p>
      </div>
    </div>
  )
  
};

export default EmptyState;