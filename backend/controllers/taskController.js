const { Task, User, Project, TaskAssignee, Tag, TaskTag, Comment } = require('../models');
const { Op } = require('sequelize');

// Obtener tareas (todas del usuario o de un proyecto específico)
const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    if (projectId) {
      // Caso: obtener tareas de un proyecto específico
      // Verificar acceso al proyecto
      const project = await Project.findOne({
        where: { id: projectId },
        include: [{
          model: User,
          as: 'members',
          where: { id: userId },
          required: false
        }]
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Proyecto no encontrado'
        });
      }

      const hasAccess = project.owner_id === userId || project.members.length > 0;
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a este proyecto'
        });
      }

      // Obtener tareas del proyecto
      const tasks = await Task.findAll({
        where: { project_id: projectId },
        include: [
          {
            model: User,
            as: 'assignees',
            attributes: ['id', 'username', 'email'],
            through: { attributes: [] }
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] }
          },
          {
            model: Comment,
            as: 'comments',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email']
            }]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return res.json({
        success: true,
        data: { tasks }
      });

    } else {
      // Caso: obtener todas las tareas del usuario
      const userProjects = await Project.findAll({
        where: {
          [Op.or]: [
            { owner_id: userId },
            {
              id: {
                [Op.in]: await Project.findAll({
                  include: [{
                    model: User,
                    as: 'members',
                    where: { id: userId }
                  }],
                  attributes: ['id']
                }).then(projects => projects.map(p => p.id))
              }
            }
          ]
        }
      });

      const projectIds = userProjects.map(project => project.id);

      const tasks = await Task.findAll({
        where: { 
          project_id: { [Op.in]: projectIds } 
        },
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'nombre']
          },
          {
            model: User,
            as: 'assignees',
            attributes: ['id', 'username', 'email'],
            through: { attributes: [] }
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] }
          },
          {
            model: Comment,
            as: 'comments',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email']
            }]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return res.json({
        success: true,
        data: { tasks }
      });
    }

  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener una tarea específica
const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'nombre', 'owner_id']
        },
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'username', 'email'],
          through: { attributes: [] }
        },
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name', 'color'],
          through: { attributes: [] }
        },
        {
          model: Comment,
          as: 'comments',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email']
          }],
          order: [['created_at', 'ASC']]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        task
      }
    });

  } catch (error) {
    console.error('Error al obtener tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nueva tarea
const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, due_date, assignees = [], tags = [] } = req.body;

    // Validaciones
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'El título de la tarea es requerido'
      });
    }

    // Crear tarea y asignaciones en transacción
    const result = await require('../config/database').sequelize.transaction(async (t) => {
      // Crear tarea
      const newTask = await Task.create({
        project_id: projectId,
        title,
        description,
        status: status || 'pending',
        priority: priority || 'medium',
        due_date: due_date ? new Date(due_date) : null
      }, { transaction: t });

      // Asignar usuarios si se proporcionaron
      if (assignees.length > 0) {
        const taskAssignees = assignees.map(userId => ({
          task_id: newTask.id,
          user_id: userId
        }));
        await TaskAssignee.bulkCreate(taskAssignees, { transaction: t });
      }

      // Asignar etiquetas si se proporcionaron
      if (tags.length > 0) {
        const taskTags = tags.map(tagId => ({
          task_id: newTask.id,
          tag_id: tagId
        }));
        await TaskTag.bulkCreate(taskTags, { transaction: t });
      }

      return newTask;
    });

    // Obtener tarea con todas las relaciones
    const taskWithDetails = await Task.findByPk(result.id, {
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'username', 'email'],
          through: { attributes: [] }
        },
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name', 'color'],
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      data: {
        task: taskWithDetails
      }
    });

  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar tarea
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date } = req.body;

    // Validar que al menos un campo esté presente
    if (!title && !description && !status && !priority && due_date === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un campo para actualizar'
      });
    }

    const updateData = { updated_at: new Date() };
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;

    const [updatedRows] = await Task.update(updateData, {
      where: { id }
    });

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Obtener tarea actualizada
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'username', 'email'],
          through: { attributes: [] }
        },
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name', 'color'],
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Tarea actualizada exitosamente',
      data: {
        task: updatedTask
      }
    });

  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar tarea
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await Task.destroy({
      where: { id }
    });

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Tarea eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Asignar usuarios a una tarea
const assignUsers = async (req, res) => {
  try {
    const { id } = req.params; // task id
    const { userIds } = req.body;

    // Validaciones
    if (!Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'userIds debe ser un array'
      });
    }

    // Realizar asignación en transacción
    await require('../config/database').sequelize.transaction(async (t) => {
      // Eliminar asignaciones existentes
      await TaskAssignee.destroy({
        where: { task_id: id }
      }, { transaction: t });

      // Crear nuevas asignaciones
      if (userIds.length > 0) {
        const taskAssignees = userIds.map(userId => ({
          task_id: id,
          user_id: userId
        }));
        await TaskAssignee.bulkCreate(taskAssignees, { transaction: t });
      }
    });

    // Obtener tarea con asignados actualizados
    const taskWithAssignees = await Task.findByPk(id, {
      include: [{
        model: User,
        as: 'assignees',
        attributes: ['id', 'username', 'email'],
        through: { attributes: [] }
      }]
    });

    res.json({
      success: true,
      message: 'Asignaciones actualizadas exitosamente',
      data: {
        task: taskWithAssignees
      }
    });

  } catch (error) {
    console.error('Error al asignar usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Asignar etiquetas a una tarea
const assignTags = async (req, res) => {
  try {
    const { id } = req.params; // task id
    const { tagIds } = req.body;

    // Validaciones
    if (!Array.isArray(tagIds)) {
      return res.status(400).json({
        success: false,
        message: 'tagIds debe ser un array'
      });
    }

    // Realizar asignación en transacción
    await require('../config/database').sequelize.transaction(async (t) => {
      // Eliminar etiquetas existentes
      await TaskTag.destroy({
        where: { task_id: id }
      }, { transaction: t });

      // Crear nuevas asignaciones
      if (tagIds.length > 0) {
        const taskTags = tagIds.map(tagId => ({
          task_id: id,
          tag_id: tagId
        }));
        await TaskTag.bulkCreate(taskTags, { transaction: t });
      }
    });

    // Obtener tarea con etiquetas actualizadas
    const taskWithTags = await Task.findByPk(id, {
      include: [{
        model: Tag,
        as: 'tags',
        attributes: ['id', 'name', 'color'],
        through: { attributes: [] }
      }]
    });

    res.json({
      success: true,
      message: 'Etiquetas actualizadas exitosamente',
      data: {
        task: taskWithTags
      }
    });

  } catch (error) {
    console.error('Error al asignar etiquetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  assignUsers,
  assignTags
};