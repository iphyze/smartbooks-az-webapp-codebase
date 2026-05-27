import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import useThemeStore from "../stores/useThemeStore";
import "./PageNav.css";

const PageNav = ({ pageTitle, links = [] }) => {
  const { theme } = useThemeStore();
  const visibleLinks = links.filter((link, index) => !(index === 0 && link.label?.toLowerCase() === "home"));

  return (
    <motion.div
      className={`pn-root ${theme === "dark" ? "pn-root--dark" : "pn-root--light"}`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="pn-left">
        <span className="pn-eyebrow"><i className="fas fa-layer-group" /> Smartbooks workspace</span>
        <h1 className="pn-title">{pageTitle}</h1>
      </div>

      <nav className="pn-breadcrumb" aria-label="Breadcrumb">
        <Link to="/" className="pn-home-link" aria-label="Return to dashboard">
          <i className="fas fa-house pn-home-icon" />
        </Link>
        {visibleLinks.map((link, index) => {
          const isLast = index === visibleLinks.length - 1;
          return (
            <React.Fragment key={`${link.label}-${index}`}>
              <i className="fas fa-chevron-right pn-sep" />
              {link.active && !isLast ? (
                <Link to={link.to} className="pn-crumb pn-crumb--link">
                  {link.label}
                </Link>
              ) : (
                <span className={`pn-crumb ${isLast ? "pn-crumb--active" : "pn-crumb--plain"}`}>
                  {link.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </motion.div>
  );
};

export default PageNav;
