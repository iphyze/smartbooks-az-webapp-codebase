import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInDown } from "../utils/animation";
import useThemeStore from "../stores/useThemeStore";

const PageNav = ({ pageTitle, links = [] }) => {
  const { theme } = useThemeStore();

  return (
    <motion.div variants={fadeInDown} initial="hidden" animate="show"
      transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
      className={`title-box-wrapper theme-${theme}`}
    >
      <div className="pagetitle">{pageTitle}</div>

      <div className="breadcrumb">
        {links.map((link, index) => {
          const { label, to, active } = link;
          const isLast = index === links.length - 1;

          return (
            <span key={index} className={`breadcrumbbox`}>

              {active ? (
                <Link to={to} className={`active-crumb-link theme-${theme}`}>
                  {label}
                    {!isLast && (<span className="crumb-separator fas fa-angle-right" />)}
                </Link>
              ) : (
                <span className="crumb-link">
                  {label}
                </span>
              )}

            </span>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PageNav;
