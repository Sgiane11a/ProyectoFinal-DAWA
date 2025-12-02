const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  searchUsers
} = require('../controllers/projectController');
const { authenticateToken, requireProjectOwnerOrAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de proyectos
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', requireProjectOwnerOrAdmin, updateProject);
router.delete('/:id', requireProjectOwnerOrAdmin, deleteProject);

// Rutas de miembros del proyecto
router.post('/:id/members', requireProjectOwnerOrAdmin, addMember);
router.delete('/:id/members/:userId', requireProjectOwnerOrAdmin, removeMember);
router.get('/:id/search-users', searchUsers);

module.exports = router;