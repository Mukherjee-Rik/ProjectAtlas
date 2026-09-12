// Custom React hooks
//
// The shared domain hooks below wrap the services in react-query so a screen
// that has already been visited reads from the cache instead of re-issuing the
// request the user has already waited through. Pages import them from their
// own module (`@/hooks/use-tables`), matching how `use-orders` is imported
// today; this barrel exists for discoverability, not as the expected path.
//
// Every list key is scoped by the active restaurant, and by the active branch
// wherever the endpoint resolves one from the `x-branch-id` header. That is a
// tenant-isolation property: an unscoped key hands one restaurant's rows to
// the next after a context switch.

export {
  useMySubscription,
  hasLiveEntitlement,
  mySubscriptionQueryKey,
  MY_SUBSCRIPTION_QUERY_KEY,
  type MySubscriptionResult,
} from './use-my-subscription';

export {
  tableKeys,
  useTables,
  useTable,
  useTableQr,
  useCreateTable,
  useUpdateTable,
  useUpdateTableStatus,
  useDeleteTable,
  useRegenerateTableQr,
} from './use-tables';

export {
  diningAreaKeys,
  useDiningAreas,
  useDiningArea,
  useCreateDiningArea,
  useUpdateDiningArea,
  useDeleteDiningArea,
} from './use-dining-areas';

export {
  menuItemKeys,
  useMenuItems,
  useMenuItem,
  useCreateMenuItem,
  useUpdateMenuItem,
  useUpdateMenuItemStatus,
  useDeleteMenuItem,
} from './use-menu-items';

export {
  branchKeys,
  useBranches,
  useBranchDetail,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from './use-branches';

export {
  dashboardKeys,
  useDashboardOverview,
  useDashboardAnalytics,
  usePlatformDashboardOverview,
} from './use-dashboard';

export { planKeys, usePlans } from './use-plans';

export {
  userKeys,
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  type UsersPage,
} from './use-users';

export {
  menuKeys,
  useMenus,
  useMenu,
  useCreateMenu,
  useUpdateMenu,
  useUpdateMenuStatus,
  useDeleteMenu,
} from './use-menus';
