import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('roles', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING
    },
    levelRole: {
      type: DataTypes.INTEGER
    },
    permissions: {
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
    model.hasMany(models.SECURITY.USERS_ROLES, {
      foreignKey: 'rolId', // <-- otra tabla
      sourceKey: 'id' // <-- tabla actual
    })
  }

  return model
}
