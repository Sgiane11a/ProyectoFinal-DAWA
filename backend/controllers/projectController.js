const { Project, User, ProjectMember, Task, Role } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los proyectos del usuario
const getProjects = async (req, res) => {
  try {
    console.log('📂 getProjects - Usuario ID:', req.user?.id);
    const userId = req.user.id;
    console.log('Fetching projects for user:', userId); // Debug log

    // Buscar proyectos donde el usuario es dueño o miembro
    const projects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'email'],
          through: { attributes: ['joined_at'] }
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'title', 'status', 'priority']
        }
      ],
      where: {
        [Op.or]: [
          { owner_id: userId },
          { '$members.id$': userId }
        ]
      },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        projects
      }
    });

  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener un proyecto específico
const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'email'],
          through: { attributes: ['joined_at'] }
        },
        {
          model: Task,
          as: 'tasks',
          include: [
            {
              model: User,
              as: 'assignees',
              attributes: ['id', 'username', 'email'],
              through: { attributes: [] }
            }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar si el usuario tiene acceso al proyecto
    const hasAccess = project.owner_id === userId || 
                     project.members.some(member => member.id === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este proyecto'
      });
    }

    res.json({
      success: true,
      data: {
        project
      }
    });

  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nuevo proyecto
const createProject = async (req, res) => {
  try {
    console.log('📋 createProject - Datos recibidos:', req.body);
    const { nombre, descripcion } = req.body;
    const userId = req.user.id;

    // Validaciones
    if (!nombre) {
      console.log('❌ Error: nombre no proporcionado');
      return res.status(400).json({
        success: false,
        message: 'El nombre del proyecto es requerido'
      });
    }

    console.log('✅ Creando proyecto:', { nombre, descripcion, userId });

    // Crear proyecto y agregar al creador como miembro en una transacción
    const result = await require('../config/database').sequelize.transaction(async (t) => {
      // Crear proyecto
      const newProject = await Project.create({
        nombre,
        descripcion,
        owner_id: userId
      }, { transaction: t });

      // Agregar al creador como miembro
      await ProjectMember.create({
        project_id: newProject.id,
        user_id: userId
      }, { transaction: t });

      return newProject;
    });

    // Obtener el proyecto con todas las relaciones
    const projectWithDetails = await Project.findByPk(result.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'email'],
          through: { attributes: ['joined_at'] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      data: {
        project: projectWithDetails
      }
    });

  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar proyecto
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    // Validaciones
    if (!nombre && !descripcion) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un campo para actualizar'
      });
    }

    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (descripcion) updateData.descripcion = descripcion;

    const [updatedRows] = await Project.update(updateData, {
      where: { id }
    });

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Obtener proyecto actualizado
    const updatedProject = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'email'],
          through: { attributes: ['joined_at'] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: {
        project: updatedProject
      }
    });

  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar proyecto
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await Project.destroy({
      where: { id }
    });

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Proyecto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Agregar miembro al proyecto
const addMember = async (req, res) => {
  try {
    const { id } = req.params; // project id
    const { userId } = req.body;

    // Validaciones
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID del usuario es requerido'
      });
    }

    // Verificar si el usuario existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si ya es miembro
    const existingMember = await ProjectMember.findOne({
      where: { project_id: id, user_id: userId }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya es miembro del proyecto'
      });
    }

    // Agregar miembro
    await ProjectMember.create({
      project_id: id,
      user_id: userId
    });

    // Obtener miembro con detalles
    const memberWithDetails = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email']
    });

    res.status(201).json({
      success: true,
      message: 'Miembro agregado exitosamente',
      data: {
        member: memberWithDetails
      }
    });

  } catch (error) {
    console.error('Error al agregar miembro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Remover miembro del proyecto
const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    // No permitir remover al dueño
    const project = await Project.findByPk(id);
    if (project.owner_id == userId) {
      return res.status(400).json({
        success: false,
        message: 'No se puede remover al dueño del proyecto'
      });
    }

    const deletedRows = await ProjectMember.destroy({
      where: { project_id: id, user_id: userId }
    });

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Miembro no encontrado en el proyecto'
      });
    }

    res.json({
      success: true,
      message: 'Miembro removido exitosamente'
    });

  } catch (error) {
    console.error('Error al remover miembro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Buscar usuarios para agregar como miembros
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const { id } = req.params; // project id

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La búsqueda debe tener al menos 2 caracteres'
      });
    }

    // Buscar usuarios que no sean miembros del proyecto
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } }
        ]
      },
      include: [{
        model: Project,
        as: 'memberProjects',
        where: { id },
        required: false // LEFT JOIN
      }],
      attributes: ['id', 'username', 'email'],
      limit: 10
    });

    // Filtrar usuarios que no son miembros
    const nonMembers = users.filter(user => user.memberProjects.length === 0);

    res.json({
      success: true,
      data: {
        users: nonMembers
      }
    });

  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  searchUsers
};