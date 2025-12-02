module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define('Tag', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: false,
      defaultValue: '#6B7280'
    }
  }, {
    tableName: 'tags',
    timestamps: false
  });

  Tag.associate = function(models) {
    // Puede estar en muchas tareas (tabla intermedia)
    Tag.belongsToMany(models.Task, {
      through: models.TaskTag,
      foreignKey: 'tag_id',
      otherKey: 'task_id',
      as: 'tasks'
    });
  };

  return Tag;
};