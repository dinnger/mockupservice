import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('secret', {
    node: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    tag: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    instance: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    data: {
      type: DataTypes.TEXT
    },
    token: {
      type: DataTypes.INTEGER
    },
    activo: {
      type: DataTypes.BOOLEAN
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

    // model.hasMany(models.FLOWS, {
    //   foreignKey: 'createdUser', // <-- otra tabla
    //   sourceKey: 'id' // <-- tabla actual
    // })
  }

  return model
}
