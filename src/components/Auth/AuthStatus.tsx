import { useAuthStore } from '../../stores/authStore';
import { useSettings } from '~/features/settings/hooks/useSettings';
import { LoginAsGuestButton } from './LoginAsGuestButton';

export function AuthStatus() {
    const { isAuthenticated, user, logout } = useAuthStore();
    const { settings } = useSettings();

    if (!isAuthenticated || !user) {
        return (
            <div className="sidebar-auth-guest">
                <span className="sidebar-auth-guest-title">Tài khoản khách</span>
                <LoginAsGuestButton />
            </div>
        );
    }

    const displayName = settings.userName || (user.type === 'guest' ? 'Tài khoản khách' : user.id);

    return (
        <div className="sidebar-auth-user">
            <span className="sidebar-auth-user-name">{displayName}</span>
            <button type="button" 
                onClick={logout}
                className="sidebar-auth-logout-btn"
            >
                Đăng xuất
            </button>
        </div>
    );
}
