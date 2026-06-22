export function Avatar({ urlOrEmoji, className = '' }: { urlOrEmoji?: string; className?: string }) {
    const isUrl = urlOrEmoji && (urlOrEmoji.includes('http') || urlOrEmoji.startsWith('data:'));
    
    return (
        <div className={`avatar ${className}`}>
            {isUrl ? <img src={urlOrEmoji} alt="avatar" /> : (urlOrEmoji || '👤')}
        </div>
    );
}
