import type { Character } from '~/types';
import { Avatar } from '~/components/ui/Avatar/Avatar';
import './Sidebar.css';

interface SidebarProps {
    characters: Character[];
    selectedCharacterId: string;
    onSelectCharacter: (id: string) => void;
    onCreateCharacter: () => void;
    onImportCharacter: () => void;
    onOpenSettings: () => void;
}

export function Sidebar({
    characters,
    selectedCharacterId,
    onSelectCharacter,
    onCreateCharacter,
    onImportCharacter,
    onOpenSettings,
}: SidebarProps) {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div>
                    <h1>RoleChat</h1>
                </div>
            </div>

            <div className="sidebar-actions">
                <button onClick={onCreateCharacter}>+ New</button>
                <button onClick={onImportCharacter}>Import Card</button>
            </div>

            <div className="character-list">
                {characters.map((character) => (
                    <button
                        key={character.id}
                        className={`character-item ${character.id === selectedCharacterId ? 'active' : ''}`}
                        onClick={() => onSelectCharacter(character.id)}
                    >
                        <Avatar urlOrEmoji={character.avatar} />
                        <div className="character-meta">
                            <strong>{character.name}</strong>
                            <span>{character.description || 'No description'}</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className="sidebar-footer">
                <button onClick={onOpenSettings}>Settings</button>
            </div>
        </aside>
    );
}
