export const ROLES = Object.freeze({
  ADMIN: "Admin",
  CONTROLLER: "Controller",
  TIMESHEET: "Timesheet",
});

export const OPERATIONAL_ROLES = [ROLES.ADMIN, ROLES.CONTROLLER];
export const TIMESHEET_ROLES = [ROLES.ADMIN, ROLES.CONTROLLER, ROLES.TIMESHEET];
export const ADMIN_ONLY_ROLES = [ROLES.ADMIN];

export const userRole = (user) => user?.integrity || "";
export const canManageUsers = (user) => userRole(user) === ROLES.ADMIN;
export const isTimesheetOnly = (user) => userRole(user) === ROLES.TIMESHEET;

export const defaultRouteForRole = (userOrRole) => {
  const role = typeof userOrRole === "string" ? userOrRole : userRole(userOrRole);
  return role === ROLES.TIMESHEET ? "/timesheet/home" : "/";
};
