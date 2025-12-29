// Profile feature exports

// Services
export {
  fetchUserProfile,
  fetchUserContent,
  followUser,
  unfollowUser,
  updateProfile,
  fetchFollowers,
  fetchFollowing,
  searchUsers,
  type UserProfile,
  type ProfileContent,
} from './services/profileService'

// Hooks
export { useProfile, useCurrentUserProfile } from './hooks/useProfile'

// Components
export { default as ProfileHeader } from './components/ProfileHeader'
export { default as ProfileContentGrid } from './components/ProfileContentGrid'
export { default as EditProfileModal } from './components/EditProfileModal'
export { default as CreatePostModal } from './components/CreatePostModal'
export { default as CreateVideoModal } from './components/CreateVideoModal'
