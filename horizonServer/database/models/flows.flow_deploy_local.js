import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('flow_deploy_local', {
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
    envData: {
      type: DataTypes.JSONB
    },
    version: {
      type: DataTypes.INTEGER
    },
    commit: {
      type: DataTypes.STRING
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdUser: {
      type: DataTypes.INTEGER
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    activeUser: {
      type: DataTypes.INTEGER
    },
    activeAt: {
      type: DataTypes.DATE
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['idFlow', 'version']
      }
    ],
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
