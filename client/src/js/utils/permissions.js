export const hasAllPermissions = (userPermissions, requiredPermissions) => {
  return requiredPermissions.every((item) => userPermissions.includes(item));
};

export const hasSomePermissions = (userPermissions, requiredPermissions) => {
  return requiredPermissions.some((item) => userPermissions.includes(item));
};
