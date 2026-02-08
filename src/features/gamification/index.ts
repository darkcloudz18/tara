export { default as BadgeDisplay } from './components/BadgeDisplay'
export {
  BADGES,
  BADGE_TIERS,
  BADGE_CATEGORIES,
  getBadgeById,
  calculatePoints,
  getUserLevel,
} from './data/badges'
export type { Badge, UserBadge, BadgeCategory, BadgeRequirement } from './data/badges'
