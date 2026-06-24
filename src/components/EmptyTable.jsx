import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../utils/animation";
import useThemeStore from "../stores/useThemeStore";
import "./EmptyTable.css";

const EmptyTableContent = ({
  icon = "fas fa-inbox",
  message = "No records found",
  description = "Try adjusting your search or filters. New records will appear here when available.",
  link,
  actionLabel = "Create New",
  onAction,
}) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    animate="show"
    transition={{ duration: 0.24, ease: "easeOut" }}
    className="empty-table-box"
    role="status"
  >
    <span className="empty-table-icon-wrap" aria-hidden="true">
      <i className={`${icon} empty-table-icon`} />
    </span>

    <div className="empty-table-copy">
      <h3 className="empty-table-title">{message}</h3>
      <p className="empty-table-text">{description}</p>
    </div>

    {link ? (
      <Link to={link} className="empty-table-action">
        <i className="fas fa-circle-plus" />
        <span>{actionLabel}</span>
      </Link>
    ) : onAction ? (
      <button type="button" className="empty-table-action" onClick={onAction}>
        <i className="fas fa-circle-plus" />
        <span>{actionLabel}</span>
      </button>
    ) : null}
  </motion.div>
);

const EmptyTable = ({ tableColSpan, ...props }) => {
  const { theme } = useThemeStore();
  const content = <EmptyTableContent {...props} />;

  if (tableColSpan) {
    return (
      <tr className={`empty-table-row theme-${theme}`}>
        <td colSpan={tableColSpan} className="empty-table-cell">{content}</td>
      </tr>
    );
  }

  return <div className={`empty-table-shell theme-${theme}`}>{content}</div>;
};

export default EmptyTable;
