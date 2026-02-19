import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
    Bold,
    Italic,
    Underline,
    Link as LinkIcon,
    Code,
    Quote,
    Smile
} from 'lucide-react'
import { EmojiStickerService, type StickerPack } from '../../services/EmojiStickerService'
import Lottie from 'lottie-react'

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    minHeight?: string
    onSubmit?: () => void
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = 'Почніть писати...',
    className = '',
    minHeight = '120px',
    onSubmit
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null)
    const [showLinkInput, setShowLinkInput] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [emojiTab, setEmojiTab] = useState<'standard' | 'custom' | 'stickers'>('standard')
    const [linkUrl, setLinkUrl] = useState('')
    const [stickerPacks, setStickerPacks] = useState<StickerPack[]>([])
    const [loadingStickers, setLoadingStickers] = useState(true)

    // Load sticker packs on mount
    useEffect(() => {
        const loadStickers = async () => {
            try {
                const packs = await EmojiStickerService.getActiveStickerPacks()
                console.log('Loaded sticker packs:', packs)
                setStickerPacks(packs)
            } catch (error) {
                console.error('Failed to load stickers:', error)
            } finally {
                setLoadingStickers(false)
            }
        }
        loadStickers()
    }, [])

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value
        }
    }, [value])

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML)
        }
    }

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value)
        editorRef.current?.focus()
    }

    const insertLink = () => {
        if (linkUrl) {
            execCommand('createLink', linkUrl)
            setLinkUrl('')
            setShowLinkInput(false)
        }
    }

    const insertEmoji = (emoji: string) => {
        if (editorRef.current) {
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                range.deleteContents()
                range.insertNode(document.createTextNode(emoji))
                range.collapse(false)
                handleInput()
            }
        }
    }

    // Common emoji shortcuts
    const commonEmojis = ['😀', '😂', '❤️', '👍', '🔥', '✨', '💪', '🎉', '🚀', '💎', '📈', '💰', '🎯', '⚡', '🌟', '💯']

    return (
        <div className={`border border-border rounded-xl overflow-hidden bg-background ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-border bg-surface/50 flex-wrap">
                <button
                    type="button"
                    onClick={() => execCommand('bold')}
                    className="p-1.5 hover:bg-surface-hover rounded text-gray-400 hover:text-white transition-colors"
                    title="Жирний (Ctrl+B)"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('italic')}
                    className="p-1.5 hover:bg-surface-hover rounded text-gray-400 hover:text-white transition-colors"
                    title="Курсив (Ctrl+I)"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('underline')}
                    className="p-1.5 hover:bg-surface-hover rounded text-gray-400 hover:text-white transition-colors"
                    title="Підкреслений (Ctrl+U)"
                >
                    <Underline className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-border mx-1" />

                <button
                    type="button"
                    onClick={() => execCommand('formatBlock', 'blockquote')}
                    className="p-1.5 hover:bg-surface-hover rounded text-gray-400 hover:text-white transition-colors"
                    title="Цитата"
                >
                    <Quote className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('formatBlock', 'pre')}
                    className="p-1.5 hover:bg-surface-hover rounded text-gray-400 hover:text-white transition-colors"
                    title="Код"
                >
                    <Code className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-border mx-1" />

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        className="p-1.5 hover:bg-surface-hover rounded text-gray-400 hover:text-white transition-colors"
                        title="Додати посилання"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>
                    {showLinkInput && (
                        <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg p-2 shadow-xl z-10 flex gap-2">
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://..."
                                className="px-2 py-1 bg-background border border-border rounded text-sm w-48 focus:outline-none focus:border-primary"
                                onKeyDown={(e) => e.key === 'Enter' && insertLink()}
                            />
                            <button
                                type="button"
                                onClick={insertLink}
                                className="px-2 py-1 bg-primary text-white rounded text-sm hover:bg-primary-hover"
                            >
                                Додати
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Emoji/Sticker picker */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 hover:bg-surface-hover rounded text-gray-400 hover:text-white transition-colors"
                        title="Емоджі та стікери"
                    >
                        <Smile className="w-4 h-4" />
                    </button>
                    {showEmojiPicker && createPortal(
                        <>
                            {/* Full-screen overlay */}
                            <div
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
                                onClick={() => setShowEmojiPicker(false)}
                            />

                            {/* Full-screen modal */}
                            <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[700px] bg-surface border border-border rounded-2xl shadow-2xl z-[10000] flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                                    <h3 className="text-lg font-semibold text-white">Емоджі та Стікери</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(false)}
                                        className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-gray-400 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-border p-2 gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setEmojiTab('standard')}
                                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${emojiTab === 'standard' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                                            }`}
                                    >
                                        😊 Емоджі
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEmojiTab('custom')}
                                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${emojiTab === 'custom' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                                            }`}
                                    >
                                        ⭐ Кастомні
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEmojiTab('stickers')}
                                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${emojiTab === 'stickers' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                                            }`}
                                    >
                                        🎨 Стікери
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-4 overflow-y-auto flex-1">
                                    {emojiTab === 'standard' && (
                                        <div className="grid grid-cols-8 md:grid-cols-10 gap-2">
                                            {commonEmojis.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => {
                                                        insertEmoji(emoji)
                                                        setShowEmojiPicker(false)
                                                    }}
                                                    className="w-12 h-12 flex items-center justify-center hover:bg-surface-hover rounded-lg text-2xl transition-all hover:scale-110"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {emojiTab === 'custom' && (
                                        <div className="text-center py-12 text-gray-500">
                                            <div className="text-4xl mb-3">⭐</div>
                                            <div className="text-sm">Кастомні емоджі</div>
                                            <div className="text-xs text-gray-600 mt-1">(додайте в адмін панелі)</div>
                                        </div>
                                    )}
                                    {emojiTab === 'stickers' && (
                                        <div>
                                            {loadingStickers ? (
                                                <div className="text-center py-12 text-gray-500">
                                                    <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                                                    <div className="text-sm">Завантаження...</div>
                                                </div>
                                            ) : stickerPacks.length === 0 ? (
                                                <div className="text-center py-12 text-gray-500">
                                                    <div className="text-4xl mb-3">🎨</div>
                                                    <div className="text-sm">Немає стікерів</div>
                                                    <div className="text-xs text-gray-600 mt-1">(додайте в адмін панелі)</div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {stickerPacks.filter(pack => pack.isActive).map(pack => (
                                                        <div key={pack.id}>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="text-sm font-semibold text-white">{pack.name}</div>
                                                                <div className="text-xs text-gray-500">({pack.stickers.length})</div>
                                                            </div>
                                                            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                                                                {pack.stickers.map(sticker => {
                                                                    try {
                                                                        const animData = typeof sticker.lottieData === 'string'
                                                                            ? JSON.parse(sticker.lottieData)
                                                                            : sticker.lottieData
                                                                        return (
                                                                            <button
                                                                                key={sticker.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    // Stickers replace content and submit immediately
                                                                                    const stickerCode = `[sticker:${sticker.id}]`
                                                                                    onChange(stickerCode)
                                                                                    setShowEmojiPicker(false)
                                                                                    if (onSubmit) {
                                                                                        // Small delay to ensure state update propagates
                                                                                        setTimeout(onSubmit, 0)
                                                                                    }
                                                                                }}
                                                                                className="aspect-square p-3 hover:bg-surface-hover rounded-xl transition-all hover:scale-105 border border-transparent hover:border-primary"
                                                                                title={sticker.name}
                                                                            >
                                                                                <Lottie
                                                                                    animationData={animData}
                                                                                    loop={true}
                                                                                    className="w-full h-full"
                                                                                />
                                                                            </button>
                                                                        )
                                                                    } catch (error) {
                                                                        console.error('Failed to parse sticker:', error)
                                                                        return null
                                                                    }
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>,
                        document.body
                    )}
                </div>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="p-4 focus:outline-none text-gray-300 prose prose-invert max-w-none"
                style={{ minHeight }}
                data-placeholder={placeholder}
            />

            <style>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: rgb(107 114 128);
                    pointer-events: none;
                }
                
                [contenteditable] blockquote {
                    border-left: 3px solid rgb(79, 70, 229);
                    padding-left: 1rem;
                    color: rgb(156, 163, 175);
                    font-style: italic;
                }
                
                [contenteditable] pre {
                    background: rgb(17, 24, 39);
                    border: 1px solid rgb(55, 65, 81);
                    border-radius: 0.5rem;
                    padding: 0.75rem;
                    font-family: 'Courier New', monospace;
                    overflow-x: auto;
                }
                
                [contenteditable] a {
                    color: rgb(79, 70, 229);
                    text-decoration: underline;
                }
                
                [contenteditable] b, [contenteditable] strong {
                    font-weight: 700;
                }
                
                [contenteditable] i, [contenteditable] em {
                    font-style: italic;
                }
                
                [contenteditable] u {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    )
}
