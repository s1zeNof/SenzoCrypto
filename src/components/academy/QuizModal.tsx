import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Brain, CheckCircle, XCircle, Trophy, ArrowRight, AlertTriangle } from 'lucide-react'
import { generateQuiz, calculateScore, type Quiz } from '@/services/QuizService'
import { saveQuizResult } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'

interface QuizModalProps {
    isOpen: boolean
    onClose: () => void
    postContent: string
    postId: string
    postTitle: string
}

export default function QuizModal({ isOpen, onClose, postContent, postId, postTitle }: QuizModalProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, number>>({})
    const [showResult, setShowResult] = useState(false)
    const [score, setScore] = useState(0)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && postContent) {
            startQuiz()
        }
    }, [isOpen, postContent])

    const startQuiz = async () => {
        setLoading(true)
        setShowResult(false)
        setError(null)
        setAnswers({})
        setCurrentQuestionIndex(0)
        try {
            const generatedQuiz = await generateQuiz(postContent)
            setQuiz(generatedQuiz)
        } catch (error: any) {
            console.error('Failed to generate quiz:', error)
            setError(error.message || 'Не вдалося згенерувати квіз. Спробуйте пізніше.')
        } finally {
            setLoading(false)
        }
    }

    const handleAnswer = (optionIndex: number) => {
        if (!quiz) return
        const currentQuestion = quiz.questions[currentQuestionIndex]
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }))
    }

    const handleNext = async () => {
        if (!quiz) return
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            finishQuiz()
        }
    }

    const finishQuiz = async () => {
        if (!quiz || !user) return
        const finalScore = calculateScore(quiz.questions, answers)
        setScore(finalScore)
        setShowResult(true)

        setSaving(true)
        try {
            await saveQuizResult(user.id, postId, finalScore)
        } catch (error) {
            console.error('Failed to save quiz result:', error)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 z-50 max-h-[90vh] overflow-y-auto shadow-2xl shadow-primary/10 animate-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                            <Brain className="w-6 h-6 text-primary" />
                            AI Quiz: {postTitle}
                        </Dialog.Title>
                        <Dialog.Close className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </Dialog.Close>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="relative w-16 h-16 mx-auto">
                                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <Brain className="absolute inset-0 w-8 h-8 m-auto text-primary animate-pulse" />
                            </div>
                            <h3 className="text-lg font-medium">ШІ аналізує статтю...</h3>
                            <p className="text-sm text-gray-400">Генеруємо питання для перевірки знань</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="inline-block p-4 rounded-full bg-red-500/10 text-red-500 mb-2">
                                <AlertTriangle className="w-12 h-12" />
                            </div>
                            <h3 className="text-lg font-medium text-red-400">Помилка</h3>
                            <p className="text-sm text-gray-400 max-w-xs mx-auto">{error}</p>
                            <button
                                onClick={startQuiz}
                                className="px-6 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors mt-4"
                            >
                                Спробувати знову
                            </button>
                        </div>
                    ) : showResult ? (
                        <div className="text-center py-8 space-y-6 animate-in zoom-in-50 duration-300">
                            <div className="inline-block p-4 rounded-full bg-surface border border-border mb-4">
                                {score >= 70 ? (
                                    <Trophy className="w-16 h-16 text-yellow-400" />
                                ) : (
                                    <Brain className="w-16 h-16 text-gray-400" />
                                )}
                            </div>

                            <div>
                                <h2 className="text-3xl font-bold mb-2">{score}%</h2>
                                <p className={`text-lg font-medium ${score >= 70 ? 'text-success' : 'text-red-400'}`}>
                                    {score >= 70 ? 'Вітаємо! Ви засвоїли матеріал!' : 'Спробуйте ще раз'}
                                </p>
                                {score >= 70 && (
                                    <p className="text-sm text-gray-400 mt-2">
                                        Статтю додано до вашого списку "Засвоєні"
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors"
                                >
                                    Закрити
                                </button>
                                {score < 70 && (
                                    <button
                                        onClick={startQuiz}
                                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                                    >
                                        Спробувати ще
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : quiz && (
                        <div className="space-y-6">
                            {/* Progress Bar */}
                            <div className="w-full bg-surface-hover h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-300"
                                    style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                                />
                            </div>

                            {/* Question */}
                            <div>
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                    Питання {currentQuestionIndex + 1} з {quiz.questions.length}
                                </span>
                                <h3 className="text-xl font-bold mt-2 mb-6">
                                    {quiz.questions[currentQuestionIndex].text}
                                </h3>

                                <div className="space-y-3">
                                    {quiz.questions[currentQuestionIndex].options.map((option, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleAnswer(index)}
                                            className={`w-full p-4 text-left rounded-xl border transition-all duration-200 flex items-center justify-between group ${answers[quiz.questions[currentQuestionIndex].id] === index
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border bg-surface hover:border-primary/50 hover:bg-surface-hover'
                                                }`}
                                        >
                                            <span>{option}</span>
                                            {answers[quiz.questions[currentQuestionIndex].id] === index && (
                                                <CheckCircle className="w-5 h-5" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end pt-4 border-t border-border">
                                <button
                                    onClick={handleNext}
                                    disabled={answers[quiz.questions[currentQuestionIndex].id] === undefined}
                                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {currentQuestionIndex === quiz.questions.length - 1 ? 'Завершити' : 'Далі'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
