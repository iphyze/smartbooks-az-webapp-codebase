import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";
import useAuthStore from "../../stores/useAuthStore";
import "./ViewUser.css";

const ROLE_META = {
  Admin: { icon: "fa-user-shield", className: "admin" },
  Controller: { icon: "fa-scale-balanced", className: "controller" },
  Timesheet: { icon: "fa-clock", className: "timesheet" },
};

const DetailItem = ({ icon, label, value, subtle = false }) => (
  <div className={`user-view-detail ${subtle ? "is-subtle" : ""}`}>
    <span className="user-view-detail__icon" aria-hidden="true">
      <i className={`fas ${icon}`} />
    </span>
    <span className="user-view-detail__copy">
      <span className="user-view-detail__label">{label}</span>
      <strong className="user-view-detail__value">{value || "Not provided"}</strong>
    </span>
  </div>
);

const ViewUserContent = ({ user }) => {
  const { theme } = useThemeStore();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const userId = user.id ?? user.user_id;
  const fullName = [user.fname, user.lname].filter(Boolean).join(" ") || "Smartbooks User";
  const initials = [user.fname, user.lname]
    .filter(Boolean)
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SU";
  const role = user.integrity || "User";
  const roleMeta = ROLE_META[role] || { icon: "fa-user", className: "user" };
  const isAdmin = currentUser?.integrity === "Admin";
  const requiresPasswordChange = Boolean(user.must_change_password);
  const isPrimaryAdmin = String(user.email || "").toLowerCase() === "admin@a-zconsultancyltd.com";

  const formatDateTime = (value) => {
    if (!value) return "Not recorded";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not recorded";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={`user-view-card theme-${theme}`}
    >
      <div className="user-view-card__glow" aria-hidden="true" />

      <header className="user-view-hero">
        <div className="user-view-identity">
          <div className="user-view-avatar" aria-hidden="true">{initials}</div>
          <div className="user-view-identity__copy">
            <span className="user-view-eyebrow">
              <i className="fas fa-layer-group" /> Smartbooks user profile
            </span>
            <h2>{fullName}</h2>
            <p>{user.email || "No email address available"}</p>
            <div className="user-view-badges">
              <span className={`user-view-badge user-view-badge--${roleMeta.className}`}>
                <i className={`fas ${roleMeta.icon}`} /> {role}
              </span>
              <span className="user-view-badge user-view-badge--active">
                <i className="fas fa-circle-check" /> Active account
              </span>
              {isPrimaryAdmin && (
                <span className="user-view-badge user-view-badge--primary">
                  <i className="fas fa-crown" /> Primary admin
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="user-view-actions">
          <button
            type="button"
            className="user-view-button user-view-button--secondary"
            onClick={() => navigate("/users/home")}
          >
            <i className="fas fa-arrow-left" />
            <span>Back to users</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              className="user-view-button user-view-button--primary"
              onClick={() => navigate(`/users/edit/${userId}`, { state: { user } })}
            >
              <i className="fas fa-pen-to-square" />
              <span>Edit user</span>
            </button>
          )}
        </div>
      </header>

      <div className="user-view-highlight-grid">
        <article className="user-view-highlight">
          <span className="user-view-highlight__icon"><i className="fas fa-id-card" /></span>
          <div>
            <span>User ID</span>
            <strong>{userId ? `#${userId}` : "Not assigned"}</strong>
          </div>
        </article>
        <article className="user-view-highlight">
          <span className="user-view-highlight__icon"><i className="fas fa-shield-halved" /></span>
          <div>
            <span>Password status</span>
            <strong>{requiresPasswordChange ? "Update required" : "Password secured"}</strong>
          </div>
        </article>
        <article className="user-view-highlight">
          <span className="user-view-highlight__icon"><i className="fas fa-link" /></span>
          <div>
            <span>Linked staff profile</span>
            <strong>{user.linked_staff_name || (role === "Timesheet" ? "Not linked" : "Not required")}</strong>
          </div>
        </article>
      </div>

      <div className="user-view-grid">
        <section className="user-view-panel">
          <div className="user-view-panel__heading">
            <span className="user-view-panel__heading-icon"><i className="fas fa-user" /></span>
            <div>
              <h3>Personal information</h3>
              <p>Identity and contact information for this account.</p>
            </div>
          </div>
          <div className="user-view-panel__body">
            <DetailItem icon="fa-user" label="First name" value={user.fname} />
            <DetailItem icon="fa-user" label="Last name" value={user.lname} />
            <DetailItem icon="fa-envelope" label="Email address" value={user.email} />
            <DetailItem icon="fa-at" label="Username" value={user.username || user.email} subtle />
          </div>
        </section>

        <section className="user-view-panel">
          <div className="user-view-panel__heading">
            <span className="user-view-panel__heading-icon"><i className="fas fa-key" /></span>
            <div>
              <h3>Access and security</h3>
              <p>Role assignment and sign-in requirements.</p>
            </div>
          </div>
          <div className="user-view-panel__body">
            <DetailItem icon={roleMeta.icon} label="Assigned role" value={role} />
            <DetailItem
              icon="fa-lock"
              label="Password state"
              value={requiresPasswordChange ? "Temporary password — change required" : "Private password configured"}
            />
            <DetailItem
              icon="fa-user-tie"
              label="Staff profile"
              value={user.linked_staff_name || (role === "Timesheet" ? "Not linked" : "Not applicable")}
              subtle
            />
            <DetailItem
              icon="fa-shield"
              label="Account protection"
              value={isPrimaryAdmin ? "Primary admin protection enabled" : "Standard account protection"}
              subtle
            />
          </div>
        </section>

        <section className="user-view-panel user-view-panel--wide">
          <div className="user-view-panel__heading">
            <span className="user-view-panel__heading-icon"><i className="fas fa-clock-rotate-left" /></span>
            <div>
              <h3>Account history</h3>
              <p>Creation and most recent update information.</p>
            </div>
          </div>
          <div className="user-view-audit-grid">
            <DetailItem icon="fa-user-plus" label="Created by" value={user.created_by || "Not recorded"} />
            <DetailItem icon="fa-calendar-plus" label="Created at" value={formatDateTime(user.created_at)} subtle />
            <DetailItem icon="fa-user-pen" label="Last updated by" value={user.updated_by || "Not recorded"} />
            <DetailItem icon="fa-calendar-check" label="Last updated at" value={formatDateTime(user.updated_at)} subtle />
          </div>
        </section>
      </div>
    </motion.section>
  );
};

export default ViewUserContent;
