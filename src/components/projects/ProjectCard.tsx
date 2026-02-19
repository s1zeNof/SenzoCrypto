import { Link } from 'react-router-dom'
import { Target, TrendingUp, Calendar, ArrowRight } from 'lucide-react'
import { Project } from '@/services/ProjectService'

interface ProjectCardProps {
    project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const progress = Math.min(100, Math.max(0, (project.currentAmount / project.targetAmount) * 100))

    return (
        <Link
            to={`/app/projects/${project.id}`}
            className="block bg-surface border border-border rounded-2xl p-6 hover:border-primary/50 hover:bg-surface-hover transition-all duration-300 group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-6 h-6" />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${project.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                        project.status === 'paused' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-blue-500/10 text-blue-500'
                    }`}>
                    {project.status === 'completed' ? 'Завершено' :
                        project.status === 'paused' ? 'На паузі' : 'Активний'}
                </div>
            </div>

            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                {project.title}
            </h3>

            <p className="text-gray-400 text-sm line-clamp-2 mb-6 h-10">
                {project.description}
            </p>

            <div className="space-y-4">
                <div className="flex justify-between items-end text-sm">
                    <span className="text-gray-400">Прогрес</span>
                    <span className="font-bold text-white">
                        {project.currentAmount} / {project.targetAmount} {project.currency}
                    </span>
                </div>

                <div className="w-full bg-surface-hover h-2 rounded-full overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex gap-2">
                        {project.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-xs px-2 py-1 bg-surface-hover rounded-md text-gray-400">
                                #{tag}
                            </span>
                        ))}
                        {project.tags.length > 2 && (
                            <span className="text-xs px-2 py-1 bg-surface-hover rounded-md text-gray-400">
                                +{project.tags.length - 2}
                            </span>
                        )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </Link>
    )
}
