const ENV = process.env.NODE_ENV

export const isDevelop = ENV === 'develop'
export const isProduction = ENV === 'production'
