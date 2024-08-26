import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('nodes', {
    node: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    data: {
      type: DataTypes.TEXT
    },
    active: {
      type: DataTypes.BOOLEAN,
      default: true
    },
    createdUser: {
      type: DataTypes.INTEGER
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
    schema: 'info'
  })

  model.associate = function (models) {
    model.hasOne(models.SECURITY.USERS, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'createdUser' // <-- tabla actual
    })
  }

  return model
}
