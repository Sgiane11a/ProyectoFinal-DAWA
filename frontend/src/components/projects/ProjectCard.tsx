'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectCardProps {
  project: {
    id: number;
    name: string;
    description?: string;
    status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
    created_at: string;
    updated_at?: string;  // Opcional ya que el backend no siempre lo proporciona
    owner: {
      id: number;
      username: string;
      email: string;
    };
    tasks?: Array<{
      id: number;
      status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
    }>;
    members?: Array<{
      id: number;
      username: string;
    }>;
  };
}

const statusColors = {
  PLANNING: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
};

const statusLabels = {
  PLANNING: 'Planificación',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
  ON_HOLD: 'En Pausa',
};

export function ProjectCard({ project }: ProjectCardProps) {
  const taskStats = project.tasks?.reduce(
    (acc, task) => {
      acc[task.status]++;
      acc.total++;
      return acc;
    },
    { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0, total: 0 }
  ) || { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0, total: 0 };

  const completionPercentage = taskStats.total > 0 
    ? Math.round((taskStats.COMPLETED / taskStats.total) * 100) 
    : 0;

  return (
    <Card className="p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link href={`/projects/${project.id}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-1">
                {project.name}
              </h3>
            </Link>
            {project.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
        </div>

        {/* Task Progress */}
        {taskStats.total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
              <span>Progreso de tareas</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{taskStats.COMPLETED} completadas</span>
              <span>{taskStats.total} total</span>
            </div>
          </div>
        )}

        {/* Team Members */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Equipo</span>
            <div className="flex -space-x-2">
              {/* Owner */}
              <div 
                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                title={`${project.owner.username} (Propietario)`}
              >
                {project.owner.username.charAt(0).toUpperCase()}
              </div>
              
              {/* Members */}
              {project.members?.slice(0, 3).map((member, index) => (
                <div
                  key={member.id}
                  className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                  title={member.username}
                >
                  {member.username.charAt(0).toUpperCase()}
                </div>
              ))}
              
              {/* More indicator */}
              {project.members && project.members.length > 3 && (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {(() => {
              const dateToFormat = project.updated_at || project.created_at;
              if (!dateToFormat) return 'Fecha no disponible';
              
              try {
                const date = new Date(dateToFormat);
                if (isNaN(date.getTime())) return 'Fecha inválida';
                
                return `Actualizado ${formatDistanceToNow(date, { 
                  addSuffix: true, 
                  locale: es 
                })}`;
              } catch (error) {
                return 'Fecha no disponible';
              }
            })()}
          </div>
          <div className="flex space-x-2">
            <Link href={`/projects/${project.id}`}>
              <Button variant="outline" size="sm">
                Ver
              </Button>
            </Link>
            <Link href={`/projects/${project.id}/edit`}>
              <Button variant="outline" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}