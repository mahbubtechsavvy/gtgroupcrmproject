// Default permission matrix per role
const DEFAULT_PERMISSIONS = {
  ceo: {
    students: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, create: true, edit: true, delete: true },
    payments: { view: true, create: true, edit: true, delete: true },
    pipeline: { view: true, create: true, edit: true, delete: true },
    appointments: { view: true, create: true, edit: true, delete: true },
    destinations: { view: true, create: true, edit: true, delete: true },
    universities: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, create: true, edit: true, delete: true },
    users: { view: true, create: true, edit: true, delete: true },
    offices: { view: true, create: true, edit: true, delete: true },
  },
  coo: {
    students: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, create: true, edit: true, delete: true },
    payments: { view: true, create: true, edit: true, delete: true },
    pipeline: { view: true, create: true, edit: true, delete: true },
    appointments: { view: true, create: true, edit: true, delete: true },
    destinations: { view: true, create: true, edit: true, delete: true },
    universities: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, create: true, edit: true, delete: true },
    users: { view: true, create: true, edit: true, delete: true },
    offices: { view: true, create: true, edit: true, delete: true },
  },
  it_manager: {
    students: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, create: true, edit: true, delete: true },
    payments: { view: true, create: true, edit: true, delete: true },
    pipeline: { view: true, create: true, edit: true, delete: true },
    appointments: { view: true, create: true, edit: true, delete: true },
    destinations: { view: true, create: true, edit: true, delete: true },
    universities: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, create: true, edit: true, delete: true },
    users: { view: true, create: true, edit: true, delete: true },
    offices: { view: true, create: true, edit: true, delete: true },
  },
  office_manager: {
    students: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, create: true, edit: true, delete: false },
    payments: { view: true, create: true, edit: true, delete: false },
    pipeline: { view: true, create: true, edit: true, delete: false },
    appointments: { view: true, create: true, edit: true, delete: true },
    destinations: { view: true, create: false, edit: false, delete: false },
    universities: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    settings: { view: true, create: false, edit: true, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    offices: { view: true, create: false, edit: false, delete: false },
  },
  senior_counselor: {
    students: { view: true, create: true, edit: true, delete: false },
    documents: { view: true, create: true, edit: true, delete: false },
    payments: { view: true, create: true, edit: true, delete: false },
    pipeline: { view: true, create: true, edit: true, delete: false },
    appointments: { view: true, create: true, edit: true, delete: true },
    destinations: { view: true, create: false, edit: false, delete: false },
    universities: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    offices: { view: false, create: false, edit: false, delete: false },
  },
  counselor: {
    students: { view: true, create: true, edit: true, delete: false },
    documents: { view: true, create: true, edit: true, delete: false },
    payments: { view: true, create: true, edit: true, delete: false },
    pipeline: { view: true, create: true, edit: true, delete: false },
    appointments: { view: true, create: true, edit: true, delete: true },
    destinations: { view: true, create: false, edit: false, delete: false },
    universities: { view: true, create: false, edit: false, delete: false },
    reports: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    offices: { view: false, create: false, edit: false, delete: false },
  },
  receptionist: {
    students: { view: true, create: true, edit: false, delete: false },
    documents: { view: true, create: true, edit: false, delete: false },
    payments: { view: true, create: false, edit: false, delete: false },
    pipeline: { view: true, create: false, edit: false, delete: false },
    appointments: { view: true, create: true, edit: true, delete: false },
    destinations: { view: true, create: false, edit: false, delete: false },
    universities: { view: true, create: false, edit: false, delete: false },
    reports: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    offices: { view: false, create: false, edit: false, delete: false },
  },
};

export function can(user, feature, action) {
  if (!user?.role) return false;
  const rolePerms = DEFAULT_PERMISSIONS[user.role];
  if (!rolePerms) return false;
  const featurePerms = rolePerms[feature];
  if (!featurePerms) return false;
  return featurePerms[action] === true;
}

export function isSuperAdmin(role) {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return ['ceo', 'coo', 'it_manager'].includes(normalizedRole);
}

export function canViewAllOffices(role) {
  return isSuperAdmin(role);
}

export function getDefaultPermissions() {
  return DEFAULT_PERMISSIONS;
}
