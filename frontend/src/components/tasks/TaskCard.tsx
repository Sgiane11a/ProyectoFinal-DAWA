'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { TaskForm } from '@/components/tasks/TaskForm';
import { format, isAfter, isBefore, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
  isOverlay?: boolean;
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800 border-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  URGENT: 'bg-red-100 text-red-800 border-red-200',
};

const priorityLabels = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export function TaskCard({ task, onUpdate, isOverlay = false }: TaskCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id.toString(),
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getDueDateColor = () => {
    if (!task.due_date) return '';
    
    const dueDate = new Date(task.due_date);
    const today = new Date();
    
    if (isBefore(dueDate, today)) {
      return 'text-red-600'; // Vencida
    } else if (isToday(dueDate)) {
      return 'text-yellow-600'; // Vence hoy
    } else if (isAfter(dueDate, today)) {
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) {
        return 'text-orange-600'; // Vence en los próximos 3 días
      }
    }
    return 'text-gray-600';
  };

  const handleTaskUpdated = () => {
    setIsEditModalOpen(false);
    onUpdate();
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`p-4 cursor-pointer hover:shadow-md transition-shadow duration-200 ${
          isDragging ? 'opacity-50' : ''
        } ${isOverlay ? 'shadow-lg' : ''}`}
      >
        {/* Header con prioridad */}
        <div className="flex items-start justify-between mb-3">
          <span className={`text-xs px-2 py-1 rounded border ${priorityColors[task.priority]}`}>
            {priorityLabels[task.priority]}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditModalOpen(true);
            }}
            className="p-1 h-auto text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
        </div>

        {/* Título */}
        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {task.title}
        </h4>

        {/* Descripción */}
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {task.description}
          </p>
        )}

        {/* Fecha límite */}
        {task.due_date && (
          <div className="flex items-center mb-3">
            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={`text-xs font-medium ${getDueDateColor()}`}>
              {format(new Date(task.due_date), 'dd MMM yyyy', { locale: es })}
            </span>
          </div>
        )}

        {/* Asignado */}
        {task.assignee && (
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2">
              {task.assignee.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-600">{task.assignee.username}</span>
          </div>
        )}

        {/* Footer con fecha de creación */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Creada {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: es })}
          </span>
        </div>
      </Card>

      {/* Modal para editar tarea */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Tarea"
        size="lg"
      >
        <TaskForm
          projectId={task.project_id}
          task={task}
          onSuccess={handleTaskUpdated}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>
    </>
  );
}