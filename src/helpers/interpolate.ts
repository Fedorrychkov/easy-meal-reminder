export const interpolate = (string: string, variables: Record<string, string | number>) => {
  const value = Object.entries(variables).reduce(
    (label, [key, value]) => label?.replaceAll(`{${key}}`, `${value}`),
    string,
  )

  return value
}
