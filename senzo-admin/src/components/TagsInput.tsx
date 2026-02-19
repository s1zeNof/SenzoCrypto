import { X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'

interface TagsInputProps {
    value: string[]
    onChange: (tags: string[]) => void
    placeholder?: string
    label?: string
}

export default function TagsInput({ value, onChange, placeholder = 'Додати...', label }: TagsInputProps) {
    const [input, setInput] = useState('')

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && input.trim()) {
            e.preventDefault()
            if (!value.includes(input.trim())) {
                onChange([...value, input.trim()])
            }
            setInput('')
        }
    }

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove))
    }

    return (
        <div className="space-y-2">
            {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}

            <div className="flex flex-wrap gap-2 mb-2">
                {value.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm border border-primary/30"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>

            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm"
            />
            <p className="text-xs text-gray-500">Натисніть Enter для додавання</p>
        </div>
    )
}
