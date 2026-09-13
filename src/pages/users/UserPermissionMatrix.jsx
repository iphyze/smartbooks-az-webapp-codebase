import React, { useEffect, useMemo, useRef } from "react";
import "./UserPermissionMatrix.css";

const MatrixCheckbox = ({ checked, indeterminate = false, className = "", ...props }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return <input ref={ref} type="checkbox" className={`user-permission-checkbox ${className}`.trim()} checked={checked} {...props} />;
};

const UserPermissionMatrix = ({
  catalogue = [],
  selectedPermissions = [],
  rolePermissions = [],
  grantablePermissions = [],
  onChange,
  disabled = false,
  loading = false,
  error = "",
}) => {
  const selectedSet = useMemo(() => new Set(selectedPermissions), [selectedPermissions]);
  const roleSet = useMemo(() => new Set(rolePermissions), [rolePermissions]);
  const grantableSet = useMemo(() => new Set(grantablePermissions), [grantablePermissions]);

  const allCodes = useMemo(
    () => catalogue.flatMap((module) => (module.permissions || []).map((permission) => permission.code)),
    [catalogue]
  );
  const mutableCodes = useMemo(
    () => allCodes.filter((code) => grantableSet.has(code)),
    [allCodes, grantableSet]
  );

  const setSelection = (codes) => onChange?.([...new Set(codes)]);
  const selectedCount = allCodes.filter((code) => selectedSet.has(code)).length;
  const allMutableSelected = mutableCodes.length > 0 && mutableCodes.every((code) => selectedSet.has(code));
  const someMutableSelected = mutableCodes.some((code) => selectedSet.has(code)) && !allMutableSelected;

  const toggleAll = () => {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (allMutableSelected) mutableCodes.forEach((code) => next.delete(code));
    else mutableCodes.forEach((code) => next.add(code));
    setSelection([...next]);
  };

  const resetToRoleDefaults = () => {
    if (disabled) return;
    const next = new Set(selectedSet);
    mutableCodes.forEach((code) => next.delete(code));
    rolePermissions.forEach((code) => {
      if (grantableSet.has(code)) next.add(code);
    });
    setSelection([...next]);
  };

  if (loading) {
    return <div className="user-permission-matrix__state">Loading permission catalogue…</div>;
  }

  if (error) {
    return <div className="user-permission-matrix__state user-permission-matrix__state--error">{error}</div>;
  }

  return (
    <section className="user-permission-matrix" aria-label="User permissions">
      <div className="user-permission-matrix__header">
        <div>
          <span className="user-permission-matrix__eyebrow"><i className="fas fa-shield-halved" /> Application permissions</span>
          <h3>Modules and actions</h3>
          <p>Role defaults are preselected. Change individual actions only when this user needs different access.</p>
        </div>
        <div className="user-permission-matrix__count">{selectedCount} / {allCodes.length} selected</div>
      </div>

      <div className="user-permission-matrix__toolbar">
        <label className="user-permission-matrix__select-all">
          <MatrixCheckbox
            checked={allMutableSelected}
            indeterminate={someMutableSelected}
            onChange={toggleAll}
            disabled={disabled || mutableCodes.length === 0}
          />
          <span>Select all permissions</span>
        </label>
        <button type="button" onClick={resetToRoleDefaults} disabled={disabled}>
          <i className="fas fa-rotate-left" /> Reset to role defaults
        </button>
      </div>

      <div className="user-permission-matrix__modules">
        {catalogue.map((module) => {
          const moduleCodes = (module.permissions || []).map((permission) => permission.code);
          const mutableModuleCodes = moduleCodes.filter((code) => grantableSet.has(code));
          const moduleAllSelected = mutableModuleCodes.length > 0 && mutableModuleCodes.every((code) => selectedSet.has(code));
          const moduleSomeSelected = mutableModuleCodes.some((code) => selectedSet.has(code)) && !moduleAllSelected;

          const toggleModule = () => {
            if (disabled) return;
            const next = new Set(selectedSet);
            if (moduleAllSelected) mutableModuleCodes.forEach((code) => next.delete(code));
            else mutableModuleCodes.forEach((code) => next.add(code));
            setSelection([...next]);
          };

          return (
            <article className="user-permission-module" key={module.module}>
              <div className="user-permission-module__heading">
                <label>
                  <MatrixCheckbox
                    checked={moduleAllSelected}
                    indeterminate={moduleSomeSelected}
                    onChange={toggleModule}
                    disabled={disabled || mutableModuleCodes.length === 0}
                  />
                  <span>{module.label}</span>
                </label>
                <small>{moduleCodes.filter((code) => selectedSet.has(code)).length}/{moduleCodes.length}</small>
              </div>

              <div className="user-permission-module__actions">
                {(module.permissions || []).map((permission) => {
                  const isGrantable = grantableSet.has(permission.code);
                  const checked = selectedSet.has(permission.code);
                  const isRoleDefault = roleSet.has(permission.code);
                  return (
                    <label
                      className={`user-permission-action ${!isGrantable ? "user-permission-action--locked" : ""}`}
                      key={permission.code}
                      title={!isGrantable ? "You cannot grant a permission you do not hold." : permission.description}
                    >
                      <input
                        type="checkbox"
                        className="user-permission-checkbox"
                        checked={checked}
                        disabled={disabled || !isGrantable}
                        onChange={() => {
                          const next = new Set(selectedSet);
                          if (checked) next.delete(permission.code);
                          else next.add(permission.code);
                          setSelection([...next]);
                        }}
                      />
                      <span className="user-permission-action__copy">
                        <strong>{permission.label}</strong>
                        <small>{permission.action}</small>
                      </span>
                      {isRoleDefault && <span className="user-permission-action__default">Role default</span>}
                      {!isGrantable && <i className="fas fa-lock user-permission-action__lock" aria-hidden="true" />}
                    </label>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default UserPermissionMatrix;
