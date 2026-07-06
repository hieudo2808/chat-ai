import ReactMarkdown from 'react-markdown';
import type { Character, Message } from '~/types';
import { Avatar } from '~/components/ui/Avatar/Avatar';
import { useSettings } from '~/features/settings/hooks/useSettings';
import { replacePlaceholders } from '~/services/promptBuilder';
import './MessageBubble.css';

interface MessageBubbleProps {
    message: Message;
    character: Character;
}

export function MessageBubble({ message, character }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const { settings } = useSettings();

    const resolvedContent = replacePlaceholders(
        message.content,
        character.name,
        settings.userName || 'User',
        character
    );

    return (
        <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
            {!isUser && <Avatar className="small" urlOrEmoji={character?.avatar} />}

            <div className={isUser ? 'message-bubble user' : 'message-bubble assistant'}>
                <ReactMarkdown>{resolvedContent}</ReactMarkdown>
            </div>
        </div>
    );
}
