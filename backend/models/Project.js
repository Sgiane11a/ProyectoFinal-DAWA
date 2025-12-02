module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'projects',
    timestamps: false
  });

  Project.associate = function(models) {
    // Pertenece a un usuario (owner)
    Project.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'owner'
    });

    // Puede tener muchos miembros (tabla intermedia)
    Project.belongsToMany(models.User, {
      through: models.ProjectMember,
      foreignKey: 'project_id',
      otherKey: 'user_id',
      as: 'members'
    });

    // Puede tener muchas tareas
    Project.hasMany(models.Task, {
      foreignKey: 'project_id',
      as: 'tasks'
    });
  };

  return Project;
};