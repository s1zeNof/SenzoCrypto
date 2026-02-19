import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { Node } from '@tiptap/core'
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Quote,
    Code,
    Undo,
    Redo,
    Palette,
    Highlighter,
    ImageIcon,
    FileCode
} from 'lucide-react'
import { useState, useCallback } from 'react'

// Custom Image Node to display images in editor
const CustomImage = Node.create({
    name: 'customImage',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            alt: {
                default: null,
            },
            title: {
                default: null,
            },
            width: {
                default: null,
            },
            height: {
                default: null,
            },
            class: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'img[src]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', HTMLAttributes]
    },

    addNodeView() {
        return ({ node }) => {
            const img = document.createElement('img')
            img.src = node.attrs.src
            if (node.attrs.alt) img.alt = node.attrs.alt
            if (node.attrs.title) img.title = node.attrs.title
            if (node.attrs.width) img.width = node.attrs.width
            if (node.attrs.height) img.height = node.attrs.height
            img.style.maxWidth = '100%'
            img.style.height = 'auto'
            img.style.display = 'block'
            img.style.margin = '1rem 0'
            img.style.borderRadius = '0.5rem'

            const wrapper = document.createElement('div')
            wrapper.style.textAlign = 'center'
            wrapper.appendChild(img)

            return {
                dom: wrapper,
            }
        }
    },
})

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [showHighlightPicker, setShowHighlightPicker] = useState(false)
    const [showHTMLMode, setShowHTMLMode] = useState(false)
    const [htmlContent, setHtmlContent] = useState('')

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            CustomImage, // Add custom image support
        ],
        content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML()
            onChange(html)
            setHtmlContent(html)
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none min-h-[400px] px-4 py-3 focus:outline-none',
            },
            handlePaste: (_, event) => {
                const html = event.clipboardData?.getData('text/html')

                // If HTML is available (copied from websites like Binance), use it
                if (html) {
                    event.preventDefault()

                    console.log('Pasted HTML:', html) // Debug

                    // Insert HTML directly - preserves images and formatting
                    editor?.commands.insertContent(html)

                    return true
                }

                // Fallback to default paste behavior
                return false
            },
        },
    })

    const addImage = useCallback(() => {
        const url = window.prompt('URL зображення:')
        if (url && editor) {
            editor.chain().focus().setNode('customImage', { src: url }).run()
        }
    }, [editor])

    const toggleHTMLMode = () => {
        if (!editor) return

        if (showHTMLMode) {
            editor.commands.setContent(htmlContent)
            setShowHTMLMode(false)
        } else {
            setHtmlContent(editor.getHTML())
            setShowHTMLMode(true)
        }
    }

    const handleHTMLChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newHTML = e.target.value
        setHtmlContent(newHTML)
        onChange(newHTML)
    }

    if (!editor) return null

    const textColors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#FFA500', '#800080']
    const highlightColors = ['#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FFA500', '#FF0000']

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-surface border-b border-border">
                {/* HTML/Visual Toggle */}
                <button
                    type="button"
                    onClick={toggleHTMLMode}
                    className={`px-3 py-2 rounded hover:bg-background transition-colors ${showHTMLMode ? 'bg-warning text-black' : 'text-gray-400'
                        }`}
                    title="HTML режим"
                >
                    <FileCode className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-border my-auto mx-1" />

                {!showHTMLMode && (
                    <>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={`p-2 rounded hover:bg-background transition-colors ${editor.isActive('bold') ? 'bg-primary text-white' : 'text-gray-400'
                                }`}
                            title="Bold"
                        >
                            <Bold className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={`p-2 rounded hover:bg-background transition-colors ${editor.isActive('italic') ? 'bg-primary text-white' : 'text-gray-400'
                                }`}
                            title="Italic"
                        >
                            <Italic className="w-4 h-4" />
                        </button>

                        <div className="w-px h-6 bg-border my-auto mx-1" />

                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={`p-2 rounded hover:bg-background transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-primary text-white' : 'text-gray-400'
                                }`}
                            title="Heading 1"
                        >
                            <Heading1 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={`p-2 rounded hover:bg-background transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-white' : 'text-gray-400'
                                }`}
                            title="Heading 2"
                        >
                            <Heading2 className="w-4 h-4" />
                        </button>

                        <div className="w-px h-6 bg-border my-auto mx-1" />

                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={`p-2 rounded hover:bg-background transition-colors ${editor.isActive('bulletList') ? 'bg-primary text-white' : 'text-gray-400'
                                }`}
                            title="Bullet List"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={`p-2 rounded hover:bg-background transition-colors ${editor.isActive('orderedList') ? 'bg-primary text-white' : 'text-gray-400'
                                }`}
                            title="Numbered List"
                        >
                            <ListOrdered className="w-4 h-4" />
                        </button>

                        <div className="w-px h-6 bg-border my-auto mx-1" />

                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            className={`p-2 rounded hover:bg-background transition-colors ${editor.isActive('blockquote') ? 'bg-primary text-white' : 'text-gray-400'
                                }`}
                            title="Quote"
                        >
                            <Quote className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                            className={`p-2 rounded hover:bg-background transition-colors ${editor.isActive('codeBlock') ? 'bg-primary text-white' : 'text-gray-400'
                                }`}
                            title="Code Block"
                        >
                            <Code className="w-4 h-4" />
                        </button>

                        <div className="w-px h-6 bg-border my-auto mx-1" />

                        <button
                            type="button"
                            onClick={addImage}
                            className="p-2 rounded hover:bg-background transition-colors text-gray-400"
                            title="Вставити зображення"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>

                        <div className="w-px h-6 bg-border my-auto mx-1" />

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="p-2 rounded hover:bg-background transition-colors text-gray-400"
                                title="Text Color"
                            >
                                <Palette className="w-4 h-4" />
                            </button>
                            {showColorPicker && (
                                <div className="absolute top-full mt-1 bg-surface border border-border rounded-lg p-2 flex gap-1 z-10">
                                    {textColors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => {
                                                editor.chain().focus().setColor(color).run()
                                                setShowColorPicker(false)
                                            }}
                                            className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                                className="p-2 rounded hover:bg-background transition-colors text-gray-400"
                                title="Highlight"
                            >
                                <Highlighter className="w-4 h-4" />
                            </button>
                            {showHighlightPicker && (
                                <div className="absolute top-full mt-1 bg-surface border border-border rounded-lg p-2 flex gap-1 z-10">
                                    {highlightColors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => {
                                                editor.chain().focus().setHighlight({ color }).run()
                                                setShowHighlightPicker(false)
                                            }}
                                            className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            editor.chain().focus().unsetHighlight().run()
                                            setShowHighlightPicker(false)
                                        }}
                                        className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform bg-background text-gray-400 text-xs"
                                        title="Remove highlight"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="w-px h-6 bg-border my-auto mx-1" />

                        <button
                            type="button"
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                            className="p-2 rounded hover:bg-background transition-colors text-gray-400 disabled:opacity-30"
                            title="Undo"
                        >
                            <Undo className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                            className="p-2 rounded hover:bg-background transition-colors text-gray-400 disabled:opacity-30"
                            title="Redo"
                        >
                            <Redo className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>

            {/* Editor */}
            <div className="bg-background">
                {showHTMLMode ? (
                    <textarea
                        value={htmlContent}
                        onChange={handleHTMLChange}
                        className="w-full min-h-[400px] px-4 py-3 bg-gray-900 text-gray-100 font-mono text-sm focus:outline-none"
                        placeholder="<p>HTML код...</p>"
                        spellCheck={false}
                    />
                ) : (
                    <EditorContent editor={editor} />
                )}
            </div>

            {/* Helper */}
            <div className="px-4 py-2 text-xs text-gray-500 bg-surface border-t border-border">
                💡 Просто скопіюйте контент з Binance (Ctrl+C) та вставте (Ctrl+V) - зображення та форматування збережуться автоматично! Відкрийте консоль (F12) для debug.
            </div>
        </div>
    )
}
