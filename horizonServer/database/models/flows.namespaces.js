import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('flow_namespaces', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING
    },
    active: {
      type: DataTypes.BOOLEAN
    },
    idDeploy: {
      type: DataTypes.INTEGER
    },
    idGroup: {
      type: DataTypes.INTEGER
    },
    isTemplate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    model.hasMany(models.FLOWS.FLOW, {
      foreignKey: 'idNamespace', // <-- otra tabla
      sourceKey: 'id' // <-- tabla actual
    })
    model.hasOne(models.FLOWS.FLOW_DEPLOY, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'idDeploy' // <-- tabla actual
    })
    model.hasOne(models.SECURITY.USERS, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'createdUser' // <-- tabla actual
    })
  }

  return model
}
