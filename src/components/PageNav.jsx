import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import useThemeStore from "../stores/useThemeStore";
import "./PageNav.css";

const PageNav = ({ pageTitle, links = [] }) => {
  const { theme } = useThemeStore();

  return (
    <motion.div
      className={`pn-root ${theme === "dark" ? "pn-root--dark" : "pn-root--light"}`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="pn-left">
        <h1 className="pn-title">{pageTitle}</h1>
      </div>

      <nav className="pn-breadcrumb" aria-label="Breadcrumb">
        <i className="fas fa-house pn-home-icon" />
        {links.map((link, index) => {
          const isLast = index === links.length - 1;
          return (
            <React.Fragment key={index}>
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