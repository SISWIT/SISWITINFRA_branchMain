/**
 * Permission Hooks for Multi-Tenant SaaS
 * 
 * Provides fine-grained permission checking for:
 * - Platform-level access
 * - Tenant-level access
 * - Module access
 * - Feature access
 */

import { useAuth } from "./useAuth";
import { useTenant } from "./useTenant";
import { AppRole, isPlatformRole } from "@/types/roles";
import { ModuleType, isModuleEnabled } from "@/types/tenant";

/**
 * Permission Check Result
 */
export interface PermissionResult {
  hasAccess: boolean;
  isPlatformAdmin: boolean;
  isTenantAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
  isClient: boolean;
  canManageUsers: boolean;
  canManageBilling: boolean;
  canManageSettings: boolean;
}

/**
 * Use permissions hook
 * Returns comprehensive permission object for the current user
 */
export function usePermissions() {
  const { user, role: userRole, loading } = useAuth();
  const { tenant, subscription, hasModule, enabledModules } = useTenant();

  const isPlatformAdmin = isPlatformRole(userRole);
  const isTenantAdmin = userRole === "admin";
  const isManager = userRole === "manager";
  const isUser = userRole === "employee" || userRole === "user";
  const isClient = userRole === "client";

  /**
   * Check if user has access to a specific module
   */
  const canAccessModule = (module: ModuleType): boolean => {
    // Platform admin can access everything
    if (isPlatformAdmin) return true;
    
    // Check tenant subscription
    return hasModule(module);
  };

  /**
   * Check if user can manage users (tenant admins)
   */
  const canManageUsers = (): boolean => {
    if (isPlatformAdmin) return true;
    return isTenantAdmin;
  };

  /**
   * Check if user can manage billing
   */
  const canManageBilling = (): boolean => {
    if (isPlatformAdmin) return true;
    return isTenantAdmin;
  };

  /**
   * Check if user can manage tenant settings
   */
  const canManageSettings = (): boolean => {
    if (isPlatformAdmin) return true;
    return isTenantAdmin || isManager;
  };

  /**
   * Check if user can access a specific feature (from subscription features)
   */
  const hasFeature = (featureKey: string): boolean => {
    if (isPlatformAdmin) return true;
    
    if (!subscription?.features) return false;
    return subscription.features[featureKey] === true;
  };

  /**
   * Check if user can create/edit/delete records
   */
  const canModify = (resourceType: "all" | "own" | "department" | "none" = "all"): boolean => {
    if (isPlatformAdmin) return true;
    if (isClient) return false;
    
    switch (resourceType) {
      case "all":
        return isTenantAdmin || isManager || isUser;
      case "own":
        return isTenantAdmin || isManager || isUser;
      case "department":
        return isTenantAdmin || isManager;
      case "none":
        return false;
      default:
        return false;
    }
  };

  /**
   * Get all permissions as an object
   */
  const permissions: PermissionResult = {
    hasAccess: !!user && !!userRole,
    isPlatformAdmin,
    isTenantAdmin,
    isManager,
    isUser,
    isClient,
    canManageUsers: canManageUsers(),
    canManageBilling: canManageBilling(),
    canManageSettings: canManageSettings(),
  };

  return {
    // User info
    user,
    userRole,
    loading,
    
    // Tenant info
    tenant,
    subscription,
    enabledModules,
    
    // Permission checks
    ...permissions,
    
    // Helper functions
    canAccessModule,
    canManageUsers,
    canManageBilling,
    canManageSettings,
    hasFeature,
    canModify,
    
    // Legacy compatibility
    isAdmin: isPlatformAdmin || isTenantAdmin,
  };
}

/**
 * Hook to check if user can access specific route/module
 */
export function useAccessControl(requiredRole?: AppRole, requiredModule?: ModuleType) {
  const { user, role: userRole, loading } = useAuth();
  const { hasModule } = useTenant();

  const isPlatformAdmin = isPlatformRole(userRole);
  const hasRequiredRole = !requiredRole || userRole === requiredRole || isPlatformAdmin;
  const hasRequiredModule = !requiredModule || hasModule(requiredModule) || isPlatformAdmin;

  return {
    canAccess: !loading && !!user && hasRequiredRole && hasRequiredModule,
    isLoading: loading,
    reason: !user 
      ? "not_authenticated" 
      : !hasRequiredRole 
        ? "insufficient_role" 
        : !hasRequiredModule 
          ? "module_not_available" 
          : "ok",
  };
}

/**
 * Hook for module-based route protection
 */
export function useModuleRoute(module: ModuleType) {
  const { canAccessModule, isPlatformAdmin } = usePermissions();
  
  return {
    canAccess: canAccessModule(module) || isPlatformAdmin,
    isEnabled: canAccessModule(module),
  };
}

/**
 * Hook for CRUD operations with tenant isolation
 */
export function useCRUD<T extends { tenant_id?: string }>(tableName: string) {
  const { user, role: userRole } = useAuth();
  const { tenant } = useTenant();
  const isPlatformAdmin = isPlatformRole(userRole);

  /**
   * Get the tenant_id to use for queries
   */
  const getTenantId = (): string | undefined => {
    if (isPlatformAdmin) return undefined; // Admin sees all
    return tenant?.id;
  };

  /**
   * Check if user can create records
   */
  const canCreate = (): boolean => {
    if (!user || !userRole) return false;
    return isPlatformAdmin || ["admin", "manager", "employee", "user"].includes(userRole);
  };

  /**
   * Check if user can read records
   */
  const canRead = (): boolean => {
    if (!user || !userRole) return false;
    return isPlatformAdmin || ["admin", "manager", "employee", "user", "client"].includes(userRole);
  };

  /**
   * Check if user can update records
   */
  const canUpdate = (record?: T): boolean => {
    if (!user || !userRole) return false;
    if (isPlatformAdmin) return true;
    if (userRole === "admin" || userRole === "manager") return true;
    if ((userRole === "employee" || userRole === "user") && record) {
      // Users can only update their own records (would need owner check)
      return true;
    }
    return false;
  };

  /**
   * Check if user can delete records
   */
  const canDelete = (): boolean => {
    if (!user || !userRole) return false;
    if (isPlatformAdmin) return true;
    return userRole === "admin" || userRole === "manager";
  };

  return {
    getTenantId,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    isPlatformAdmin,
  };
}
