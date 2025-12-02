'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/stores/projects';
import { useTaskStore } from '@/stores/tasks';
import { useRequireAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { TaskForm } from '@/components/tasks/TaskForm';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const { user } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);
  
  const { 
    currentProject, 
    isLoading: projectLoading, 
    fetchProject 
  } = useProjectStore();
  
  const { 
    projectTasks, 
    isLoading: tasksLoading, 
    fetchTasksByProject 
  } = useTaskStore();

  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && projectId) {
      const loadProjectData = async () => {
        try {
          await Promise.all([
            fetchProject(projectId),
            fetchTasksByProject(projectId)
          ]);
        } catch (error: any) {
          if (error.response?.status === 404) {
            toast.error('Proyecto no encontrado');
            router.push('/dashboard');
            return;
          }
          toast.error('Error al cargar el proyecto');
        } finally {
          setIsLoading(false);
        }
      };

      loadProjectData();
    }
  }, [user, projectId, fetchProject, fetchTasksByProject, router]);

  const handleTaskCreated = () => {
    setIsCreateTaskModalOpen(false);
    fetchTasksByProject(projectId); // Refrescar tareas
  };

  const handleTaskUpdated = () => {
    fetchTasksByProject(projectId); // Refrescar tareas
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-600">Cargando proyecto...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Proyecto no encontrado</h2>
            <p className="text-gray-600 mb-4">El proyecto que buscas no existe o no tienes acceso a él.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header del Proyecto */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{currentProject.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[currentProject.status]}`}>
                    {statusLabels[currentProject.status]}
                  </span>
                  <span className="text-gray-600">
                    Creado el {format(new Date(currentProject.created_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                  <span className="text-gray-600">
                    Por {currentProject.owner.username}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setIsCreateTaskModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Tarea
              </Button>
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar Proyecto
              </Button>
            </div>
          </div>

          {/* Descripción */}
          {currentProject.description && (
            <div className="mt-4">
              <Card className="p-4">
                <p className="text-gray-700">{currentProject.description}</p>
              </Card>
            </div>
          )}
        </div>

        {/* Estadísticas del Proyecto */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h2m0-14V5a2 2 0 012-2h2a2 2 0 012 2v2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tareas</p>
                <p className="text-2xl font-semibold text-gray-900">{projectTasks.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {projectTasks.filter(t => t.status === 'TODO').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {projectTasks.filter(t => t.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {projectTasks.filter(t => t.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tablero Kanban */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Tablero de Tareas</h2>
          <KanbanBoard 
            tasks={projectTasks} 
            onTaskUpdate={handleTaskUpdated}
            projectId={projectId}
          />
        </div>
      </main>

      {/* Modal para crear tarea */}
      <Modal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        title="Crear Nueva Tarea"
        size="lg"
      >
        <TaskForm
          projectId={projectId}
          onSuccess={handleTaskCreated}
          onCancel={() => setIsCreateTaskModalOpen(false)}
        />
      </Modal>
    </div>
  );
}