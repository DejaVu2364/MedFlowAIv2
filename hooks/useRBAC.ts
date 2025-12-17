import { useAuth } from '../contexts/AuthContext';

// Define role hierarchy and permissions
export type UserRole = 'Admin' | 'Doctor' | 'Nurse' | 'Intern' | 'Receptionist';

interface RolePermissions {
    canAccessAdmin: boolean;
    canAccessRevenue: boolean;
    canAccessBeds: boolean;
    canAccessTPA: boolean;
    canSignOrders: boolean;
    canEditClinicalFile: boolean;
    canDischarge: boolean;
    canAdmit: boolean;
    canViewAllPatients: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    Admin: {
        canAccessAdmin: true,
        canAccessRevenue: true,
        canAccessBeds: true,
        canAccessTPA: true,
        canSignOrders: true,
        canEditClinicalFile: true,
        canDischarge: true,
        canAdmit: true,
        canViewAllPatients: true,
    },
    Doctor: {
        canAccessAdmin: false,
        canAccessRevenue: true, // Can see own revenue metrics
        canAccessBeds: true,
        canAccessTPA: false,
        canSignOrders: true,
        canEditClinicalFile: true,
        canDischarge: true,
        canAdmit: true,
        canViewAllPatients: true,
    },
    Nurse: {
        canAccessAdmin: false,
        canAccessRevenue: false,
        canAccessBeds: true,
        canAccessTPA: false,
        canSignOrders: false,
        canEditClinicalFile: false,
        canDischarge: false,
        canAdmit: false,
        canViewAllPatients: true,
    },
    Intern: {
        canAccessAdmin: false,
        canAccessRevenue: false,
        canAccessBeds: true,
        canAccessTPA: false,
        canSignOrders: false, // Needs attending sign-off
        canEditClinicalFile: true, // Can draft
        canDischarge: false,
        canAdmit: false,
        canViewAllPatients: true,
    },
    Receptionist: {
        canAccessAdmin: false,
        canAccessRevenue: false,
        canAccessBeds: false,
        canAccessTPA: false,
        canSignOrders: false,
        canEditClinicalFile: false,
        canDischarge: false,
        canAdmit: true,
        canViewAllPatients: true,
    },
};

export const useRBAC = () => {
    const { currentUser } = useAuth();

    // Default to Doctor if no role specified (for demo purposes)
    const role: UserRole = (currentUser?.role as UserRole) || 'Doctor';
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Intern;

    const can = (permission: keyof RolePermissions): boolean => {
        return permissions[permission] || false;
    };

    const canAccess = (route: string): boolean => {
        switch (route) {
            case '/admin/revenue':
            case '/admin':
                return permissions.canAccessAdmin;
            case '/revenue':
                return permissions.canAccessRevenue;
            case '/beds':
                return permissions.canAccessBeds;
            case '/tpa':
                return permissions.canAccessTPA;
            default:
                return true; // Allow access to non-protected routes
        }
    };

    return {
        role,
        permissions,
        can,
        canAccess,
        isAdmin: role === 'Admin',
        isDoctor: role === 'Doctor' || role === 'Admin',
    };
};

export default useRBAC;
