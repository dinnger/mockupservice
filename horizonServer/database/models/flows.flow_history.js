import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('flow_history', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    idFlow: {
      type: DataTypes.INTEGER
    },
    flowData: {
      type: DataTypes.JSONB
    },
    version: {
      type: DataTypes.INTEGER
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
    schema: 'flows'
  })

  model.associate = function (models) {
    model.hasOne(models.FLOWS.FLOW, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'idFlow' // <-- tabla actual
    })
    model.hasOne(models.SECURITY.USERS, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'createdUser' // <-- tabla actual
    })
  }

  return model
}
