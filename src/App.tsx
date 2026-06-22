import '@fontsource/inter/index.css';
import './App.css';
import type { Character } from '~/types';

import { useSettings } from '~/features/settings/hooks/useSettings';
import { useCharacters } from '~/features/characters/hooks/useCharacters';
import { useChat } from '~/features/chat/hooks/useChat';
import { deleteMessagesByCharacterId } from '~/services/messageService';

import { SettingsModal } from '~/features/settings/components/SettingsModal/SettingsModal';
import { Sidebar } from '~/features/characters/components/Sidebar/Sidebar';
import { CharacterEditorModal } from '~/features/characters/components/CharacterEditorModal/CharacterEditorModal';
import { ImportCharacterModal } from '~/features/characters/components/ImportCharacterModal/ImportCharacterModal';
import { ChatPanel } from '~/features/chat/components/ChatPanel/ChatPanel';

export default function App() {
    const { settings, setSettings, isSettingsOpen, setIsSettingsOpen } = useSettings();

    const {
        characters,
        selectedCharacter,
        selectedCharacterId,
        setSelectedCharacterId,
        isCharacterEditorOpen,
        setIsCharacterEditorOpen,
        isImportOpen,
        setIsImportOpen,
        editingCharacter,
        setEditingCharacter,
        saveCharacter,
        importCharacter,
        deleteCharacter,
        isLoaded: isCharactersLoaded,
    } = useCharacters();

    const { currentMessages, input, setInput, isStreaming, handleSend, handleStopStreaming } = useChat(
        selectedCharacter,
        settings,
    );

    const handleSaveCharacter = async (char: Character) => {
        await saveCharacter(char);
        setIsCharacterEditorOpen(false);
    };

    const handleImportCharacter = async (char: Character) => {
        await importCharacter(char);
        setIsImportOpen(false);
    };

    const handleDeleteCharacter = async () => {
        if (!selectedCharacter) return;
        const deletedId = selectedCharacter.id;
        await deleteCharacter(deletedId);
        await deleteMessagesByCharacterId(deletedId);
    };

    if (!isCharactersLoaded) {
        return null; // Or a loading spinner
    }

    return (
        <div className="app-shell">
            <Sidebar
                characters={characters}
                selectedCharacterId={selectedCharacterId}
                onSelectCharacter={setSelectedCharacterId}
                onCreateCharacter={() => {
                    setEditingCharacter(null);
                    setIsCharacterEditorOpen(true);
                }}
                onImportCharacter={() => setIsImportOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            {selectedCharacter ? (
                <ChatPanel
                    selectedCharacter={selectedCharacter}
                    messages={currentMessages}
                    input={input}
                    isStreaming={isStreaming}
                    onInputChange={setInput}
                    onSend={() => handleSend(selectedCharacter)}
                    onStopStreaming={handleStopStreaming}
                    onEditCharacter={() => {
                        setEditingCharacter(selectedCharacter);
                        setIsCharacterEditorOpen(true);
                    }}
                    onDeleteCharacter={handleDeleteCharacter}
                />
            ) : (
                <main className="chat-panel empty-state">
                    <div className="empty-state-content">
                        <h1>Chào mừng đến với Roleplay AI</h1>
                        <p>Vui lòng tạo mới hoặc import một thẻ nhân vật để bắt đầu cuộc trò chuyện.</p>
                        <div className="empty-state-actions">
                            <button
                                onClick={() => {
                                    setEditingCharacter(null);
                                    setIsCharacterEditorOpen(true);
                                }}
                            >
                                + Tạo nhân vật mới
                            </button>
                            <button className="secondary" onClick={() => setIsImportOpen(true)}>
                                Import Card
                            </button>
                        </div>
                    </div>
                </main>
            )}

            {isSettingsOpen && (
                <SettingsModal
                    settings={settings}
                    onChange={setSettings}
                    onClose={() => setIsSettingsOpen(false)}
                    onSave={() => setIsSettingsOpen(false)}
                />
            )}

            {isCharacterEditorOpen && (
                <CharacterEditorModal
                    character={editingCharacter}
                    onClose={() => setIsCharacterEditorOpen(false)}
                    onSave={handleSaveCharacter}
                />
            )}

            {isImportOpen && (
                <ImportCharacterModal onClose={() => setIsImportOpen(false)} onImport={handleImportCharacter} />
            )}
        </div>
    );
}
