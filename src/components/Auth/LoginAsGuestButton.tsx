import { useAuthStore } from '../../stores/authStore';

export function LoginAsGuestButton() {
    const { loginGuest, isLoading } = useAuthStore();

    return (
        <button type="button" 
            onClick={loginGuest} 
            disabled={isLoading}
        >
            {isLoading ? 'Logging in...' : 'Login as Guest'}
        </button>
    );
}
