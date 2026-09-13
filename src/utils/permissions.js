export const ROLES = Object.freeze({
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  CONTROLLER: "Controller",
  USER: "User",
  TIMESHEET: "Timesheet",
});

export const OPERATIONAL_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CONTROLLER];
export const TIMESHEET_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CONTROLLER, ROLES.TIMESHEET];
export const ADMIN_ONLY_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

export const userRole = (user) => user?.integrity || "";

export const isSuperAdmin = (user) => Boolean(
  user?.is_super_admin
  || user?.rbac_is_super_admin
  || user?.rbac_role_code === "super_admin"
  || userRole(user) === ROLES.SUPER_ADMIN
);

export const userPermissions = (user) => (
  Array.isArray(user?.permissions) ? user.permissions : []
);

export const hasPermission = (user, permission) => {
  if (isSuperAdmin(user)) return true;
  if (!permission) return false;
  return userPermissions(user).includes(permission);
};

export const hasAnyPermission = (user, permissions = []) => {
  if (isSuperAdmin(user)) return true;
  return permissions.some((permission) => hasPermission(user, permission));
};

export const hasAllPermissions = (user, permissions = []) => {
  if (isSuperAdmin(user)) return true;
  return permissions.every((permission) => hasPermission(user, permission));
};

export const canManagePermissionTarget = (actor, target) => {
  if (isSuperAdmin(actor)) return true;
  if (isSuperAdmin(target)) return false;

  const actorPermissionSet = new Set(userPermissions(actor));
  return userPermissions(target).every((permission) => actorPermissionSet.has(permission));
};

export const canManageUsers = (user) => hasPermission(user, "user.view");
export const isTimesheetOnly = (user) => userRole(user) === ROLES.TIMESHEET;

export const defaultRouteForRole = (userOrRole) => {
  const user = typeof userOrRole === "string" ? null : userOrRole;
  const role = typeof userOrRole === "string" ? userOrRole : userRole(userOrRole);

  if (!user) return role === ROLES.TIMESHEET ? "/timesheet/home" : "/";

  const restrictedCostCentres = String(user?.cost_center_access_mode || "all").toLowerCase() === "restricted";

  if (hasPermission(user, "dashboard.view")) return "/";
  if (hasPermission(user, "invoice.view")) return "/invoice/home";
  if (hasPermission(user, "invoice.create")) return "/invoice/create";
  if (hasPermission(user, "journal.view")) return "/journal/home";
  if (hasPermission(user, "journal.create")) return "/journal/create";
  if (hasPermission(user, "account.view")) return "/account/home";
  if (hasPermission(user, "account.create")) return "/account/create";
  if (hasPermission(user, "ledger.view")) return "/ledger/home";
  if (hasPermission(user, "ledger.create")) return "/ledger/create";
  if (hasPermission(user, "bank.view")) return "/banks/home";
  if (hasPermission(user, "bank.create")) return "/banks/create";
  if (hasPermission(user, "exchange_rate.view")) return "/rate/home";
  if (hasPermission(user, "exchange_rate.create")) return "/rate/create";
  if (hasPermission(user, "client.view")) return "/client/home";
  if (hasPermission(user, "client.create")) return "/client/create";
  if (hasPermission(user, "staff.view")) return "/staff/home";
  if (hasPermission(user, "staff.create")) return "/staff/create-staff";
  if (hasPermission(user, "project.view")) return "/project/home";
  if (hasPermission(user, "project.create")) return "/project/create";
  if (!restrictedCostCentres && hasPermission(user, "timesheet.view")) return "/timesheet/home";
  if (!restrictedCostCentres && hasPermission(user, "timesheet.create")) return "/timesheet/create-timesheet";
  if (hasPermission(user, "report.view")) return "/reports/ledger";
  if (hasPermission(user, "ledger_statement.view")) return "/reports/ledger/ledger-statement";
  if (hasPermission(user, "general_ledger.view")) return "/reports/ledger/general-ledger";
  if (hasPermission(user, "trial_balance.view")) return "/reports/ledger/trial-balance";
  if (hasPermission(user, "profit_loss.view")) return "/reports/ledger/profit-and-loss";
  if (hasPermission(user, "balance_sheet.view")) return "/reports/ledger/balance-sheet";
  if (hasPermission(user, "invoice_aging.view")) return "/reports/invoice-aging";
  if (!restrictedCostCentres && hasPermission(user, "fx.view")) return "/reports/fx-revaluation";
  if (hasPermission(user, "bank_reconciliation.view")) return "/reports/bank-recon";
  if (hasPermission(user, "bank_reconciliation.create")) return "/reports/bank-recon/create";
  if (hasPermission(user, "user.view")) return "/users/home";
  if (hasPermission(user, "user.create")) return "/users/create-user";
  if (!restrictedCostCentres && hasAnyPermission(user, ["accounting_period.view", "accounting_period.create", "accounting_period.edit", "accounting_period.lock", "accounting_period.close", "accounting_period.reverse"])) return "/lock-period/home";
  if (!restrictedCostCentres && hasAnyPermission(user, ["cost_centre.view", "cost_centre.create", "cost_centre.edit", "cost_centre.delete"])) return "/cost-centres/home";
  if (!restrictedCostCentres && hasPermission(user, "activity_log.view")) return "/activity-logs";
  if (hasPermission(user, "notification.view")) return "/notifications";

  return "/users/my-profile";
};
