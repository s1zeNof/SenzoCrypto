import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface ProjectImageUploaderProps {
    label: string
    currentImage?: string
    onImageSelected: (file: File | null) => void
    aspectRatio?: 'cover' | 'square'  // cover = 16:9, square = 1:1
}

export default function ProjectImageUploader({
    label,
    currentImage,
    onImageSelected,
    aspectRatio = 'cover'
}: ProjectImageUploaderProps) {
    const [preview, setPreview] = useState<string | null>(currentImage || null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
            onImageSelected(file)
        }
    }

    const handleRemove = () => {
        setPreview(null)
        onImageSelected(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const aspectClasses = aspectRatio === 'cover'
        ? 'aspect-video'
        : 'aspect-square'

    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>

            {preview ? (
                <div className="relative group">
                    <img
                        src={preview}
                        alt="Preview"
                        className={`w-full ${aspectClasses} object-cover rounded-xl border border-border`}
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full ${aspectClasses} border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-surface/50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary`}
                >
                    <div className="p-3 rounded-full bg-surface">
                        {aspectRatio === 'cover' ? (
                            <ImageIcon className="w-6 h-6" />
                        ) : (
                            <Upload className="w-6 h-6" />
                        )}
                    </div>
                    <span className="text-sm font-medium">
                        {aspectRatio === 'cover' ? 'Завантажити обложку' : 'Завантажити зображення'}
                    </span>
                    <span className="text-xs text-gray-500">
                        {aspectRatio === 'cover' ? 'Рекомендовано 16:9' : 'Рекомендовано 1:1'}
                    </span>
                </button>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    )
}
