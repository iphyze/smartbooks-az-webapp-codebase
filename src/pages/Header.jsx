import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import LogoLight from '../assets/images/smartbooks/smartbooks.png';
import LogoDark from '../assets/images/smartbooks/smartbooks_dark.png';
import AvatarMale from '../assets/images/smartbooks/avarter-image-male.jpg';
import useAuthStore from "../stores/useAuthStore";
import useThemeStore from "../stores/useThemeStore";

const Header = ({ nav, setNav }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);
  const mobileSettingsRef = useRef(null);
  const Logo = theme === 'dark' ? LogoDark : LogoLight;
  const navigate = useNavigate();

  const handleToggleNav = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setNav(prevNav => !prevNav);
  };

  const handleThemeToggle = (event) => {
    event.preventDefault();
    toggleTheme();
  };

  const handleSettingsToggle = (event) => {
    event.preventDefault();
    setShowSettings(prev => !prev);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideSettings =
        settingsRef.current && !settingsRef.current.contains(event.target); 
        // && mobileSettingsRef.current && !mobileSettingsRef.current.contains(event.target);

      if (showSettings && isOutsideSettings) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  return (
    <div className={`container-header theme-${theme}`}>
      <NavLink to='/' className="navbar-logo">
        <img src={Logo} alt="logo" className="nav-dashboard-logo" />
      </NavLink>

      <div className="container-header-right-flexbox">
        <button className={`header-theme-toggle-box theme-${theme}`} onClick={handleThemeToggle}>
          <span className={`header-theme-toggle-icon fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></span>
        </button>

        <div className="settings-wrapper" ref={settingsRef}>
          <div className="settings-container">
            <button className={`header-user-box theme-${theme}`} onClick={handleSettingsToggle}>
              <img src={AvatarMale} className={`header-user-icon fas fa-user-circle theme-${theme}`} />
              {/* <div className="header-user-name-box">
                <div className={`header-user-name theme-${theme}`}>{`${user?.email.split("@")[0] || "iphyze"}`}</div>
              </div> */}
              {/* <span className={`header-arrow-icon fas ${showSettings ? 'fa-chevron-up' : 'fa-chevron-down'} theme-${theme}`}></span> */}
            </button>
          </div>

          {showSettings && (
            <div className={`settings-dropdown theme-${theme}`}>
              <div className="settings-divider"></div>
              <NavLink to="/profile" className="settings-item">
                <span className="fas fa-user-cog"></span> Profile Settings
              </NavLink>
              <NavLink to="/password" className="settings-item">
                <span className="fas fa-key"></span> Change Password
              </NavLink>
              <div className="settings-divider"></div>
              <button className="settings-item logout" onClick={handleLogout}>
                <span className="fas fa-sign-out-alt"></span> Logout
              </button>
            </div>
          )}
        </div>
      
      </div>

      <button
        className={`toggle-nav fas ${nav ? 'fa-times' : 'fa-bars'} theme-${theme}`}
        onClick={handleToggleNav}
      ></button>

      {/* <button
        ref={mobileSettingsRef}
        className={`toggle-settings fas header-arrow-icon fas ${showSettings ? 'fa-chevron-up' : 'fa-chevron-down'} theme-${theme}`}
        onClick={handleSettingsToggle}
      ></button> */}
    </div>
  );
};

export default Header;
