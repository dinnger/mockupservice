import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('users_roles', {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    rolId: {
      type: DataTypes.STRING
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
    model.hasOne(models.SECURITY.ROLES, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'rolId' // <-- tabla actual
    })

    model.hasMany(models.SECURITY.USERS, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'userId' // <-- tabla actual
    })
  }

  return model
}
