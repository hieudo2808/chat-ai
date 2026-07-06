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
import { CharacterGenerationPage } from '~/features/character-generation/components/CharacterGenerationPage';
import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '~/stores/authStore';
import { NetworkStatusBanner } from '~/features/sync/components/NetworkStatusBanner';
import { useModelProfiles } from '~/features/models/hooks/useModelProfiles';

export default function App() {
    const { checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);
    const { settings, setSettings } = useSettings();
    const { models } = useModelProfiles();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAiGenerationOpen, setIsAiGenerationOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    const effectiveSettings = useMemo(() => {
        const defaultModel = models.find((m) => m.isDefault);
        if (!defaultModel) return settings;
        return {
            ...settings,
            apiKey: defaultModel.apiKey || settings.apiKey,
            baseUrl: defaultModel.baseUrl || settings.baseUrl,
            modelName: defaultModel.modelName || settings.modelName,
            temperature: defaultModel.temperature ?? settings.temperature,
            maxTokens: defaultModel.maxTokens ?? settings.maxTokens,
            topP: defaultModel.topP ?? settings.topP,
            repetitionPenalty: defaultModel.repetitionPenalty ?? settings.repetitionPenalty,
        };
    }, [settings, models]);

    const { currentMessages, input, setInput, isStreaming, handleSend, handleStopStreaming } = useChat(
        selectedCharacter,
        effectiveSettings,
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

    const handleSaveAiCharacter = async (char: Character) => {
        await saveCharacter({
            ...char,
            id: crypto.randomUUID(), // Ensure a new ID is generated
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        setIsAiGenerationOpen(false);
    };

    if (!isCharactersLoaded) {
        return null; // Or a loading spinner
    }

    return (
        <div className="app-shell">
            <NetworkStatusBanner />
            <Sidebar
                characters={characters}
                selectedCharacterId={selectedCharacterId}
                onSelectCharacter={(id) => {
                    setSelectedCharacterId(id);
                    setIsSidebarOpen(false);
                }}
                onCreateCharacter={() => {
                    setEditingCharacter(null);
                    setIsCharacterEditorOpen(true);
                    setIsSidebarOpen(false);
                }}
                onImportCharacter={() => {
                    setIsImportOpen(true);
                    setIsSidebarOpen(false);
                }}
                onGenerateAI={() => {
                    setIsAiGenerationOpen(true);
                    setIsSidebarOpen(false);
                }}
                onSettingsClick={() => {
                    setIsSettingsOpen(true);
                    setIsSidebarOpen(false);
                }}
                isMobileOpen={isSidebarOpen}
                onCloseMobile={() => setIsSidebarOpen(false)}
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
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
            ) : (
                <main className="chat-panel empty-state">
                    <header className="chat-header mobile-only-header">
                        <button className="menu-button" onClick={() => setIsSidebarOpen(true)} aria-label="Mở danh mục">
                            ☰
                        </button>
                        <h2>RoleChat</h2>
                    </header>
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
                            <button className="secondary" onClick={() => setIsAiGenerationOpen(true)}>
                                AI Generate
                            </button>
                        </div>
                    </div>
                </main>
            )}



            {isAiGenerationOpen && (
                <CharacterGenerationPage onClose={() => setIsAiGenerationOpen(false)} onSave={handleSaveAiCharacter} />
            )}

            {isSettingsOpen && (
                <SettingsModal
                    settings={settings}
                    onClose={() => setIsSettingsOpen(false)}
                    onSave={(newSettings) => {
                        setSettings(newSettings);
                        setIsSettingsOpen(false);
                    }}
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
