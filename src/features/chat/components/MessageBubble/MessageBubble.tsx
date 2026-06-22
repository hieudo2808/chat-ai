import ReactMarkdown from 'react-markdown';
import type { Character, Message } from '~/types';
import { Avatar } from '~/components/ui/Avatar/Avatar';
import './MessageBubble.css';

interface MessageBubbleProps {
    message: Message;
    character: Character;
}

export function MessageBubble({ message, character }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
            {!isUser && <Avatar className="small" urlOrEmoji={character?.avatar} />}

            <div className={isUser ? 'message-bubble user' : 'message-bubble assistant'}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
        </div>
    );
}
