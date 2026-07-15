import type { Character } from '~/types';
import { Avatar } from '~/components/ui/Avatar/Avatar';
import { AuthStatus } from '~/components/Auth/AuthStatus';
import { SyncStatusIndicator } from '~/features/sync/components/SyncStatusIndicator';
import { useSettings } from '~/features/settings/hooks/useSettings';
import { replacePlaceholders } from '~/services/promptBuilder';
import './Sidebar.css';

interface SidebarProps {
    characters: Character[];
    selectedCharacterId: string;
    onSelectCharacter: (id: string) => void;
    onCreateCharacter: () => void;
    onImportCharacter: () => void;
    onGenerateAI: () => void;
    onSettingsClick: () => void;
    isMobileOpen?: boolean;
    onCloseMobile?: () => void;
}

export function Sidebar({
    characters,
    selectedCharacterId,
    onSelectCharacter,
    onCreateCharacter,
    onImportCharacter,
    onGenerateAI,
    onSettingsClick,
    isMobileOpen = false,
    onCloseMobile,
}: SidebarProps) {
    const { settings } = useSettings();

    return (
        <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
                <div>
                    <h1>RoleChat</h1>
                </div>
                {onCloseMobile && (
                    <button type="button" className="sidebar-close-button" onClick={onCloseMobile} aria-label="Đóng menu">
                        &times;
                    </button>
                )}
            </div>

            <div className="sidebar-actions">
                <button type="button" onClick={onCreateCharacter}>+ Tạo mới</button>
                <button type="button" onClick={onImportCharacter}>Nhập Card</button>
                <button type="button" onClick={onGenerateAI}>✨ AI Generate</button>
            </div>

            <div className="character-list">
                {characters.map((character) => (
                    <button type="button"
                        key={character.id}
                        className={`character-item ${character.id === selectedCharacterId ? 'active' : ''}`}
                        onClick={() => onSelectCharacter(character.id)}
                    >
                        <Avatar urlOrEmoji={character.avatar} />
                        <div className="character-meta">
                            <strong>{character.name}</strong>
                            <span>{replacePlaceholders(character.description, character.name, settings.userName || 'User', character) || 'Không có mô tả'}</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className="sidebar-footer">
                <button type="button" onClick={onSettingsClick}>Cài đặt</button>
            </div>
            
            <div className="sidebar-auth-panel">
                <AuthStatus />
                <div className="sidebar-sync-container">
                    <SyncStatusIndicator />
                </div>
            </div>
        </aside>
    );
}
