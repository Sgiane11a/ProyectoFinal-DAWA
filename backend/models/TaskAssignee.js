module.exports = (sequelize, DataTypes) => {
  const TaskAssignee = sequelize.define('TaskAssignee', {
    task_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'task_assignees',
    timestamps: false
  });

  return TaskAssignee;
};