import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('process_namespaces', {
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
    schema: 'processes'
  })

  model.associate = function (models) {
    model.hasMany(models.PROCESSES.PROCESS, {
      foreignKey: 'idNamespace', // <-- otra tabla
      sourceKey: 'id' // <-- tabla actual
    })
    model.hasOne(models.PROCESSES.PROCESS_DEPLOY, {
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
