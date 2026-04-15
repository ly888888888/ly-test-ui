export function hasPerm(userPerms, required) {
  const perms = userPerms || []
  if (perms.includes('superadmin')) return true
  if (!required) return true
  const list = Array.isArray(required) ? required : [required]
  return list.every(p => perms.includes(p))
}

export function hasAnyPerm(userPerms, requiredList) {
  const perms = userPerms || []
  if (perms.includes('superadmin')) return true
  if (!requiredList || !requiredList.length) return true
  return requiredList.some(p => perms.includes(p))
}
