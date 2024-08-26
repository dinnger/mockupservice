import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('users_projects', {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    project: {
      type: DataTypes.ARRAY(DataTypes.STRING)
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    // indexes: [
    //     {
    //         unique: true,
    //         fields: ['nombre', 'nivel']
    //     }
    // ],
    timestamps: false,
    freezeTableName: true,
    schema: 'security'
  })

  model.associate = function (models) {
    model.hasMany(models.SECURITY.USERS, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'userId' // <-- tabla actual
    })
  }

  return model
}
