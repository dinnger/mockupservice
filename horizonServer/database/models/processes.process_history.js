import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('process_history', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    idProcess: {
      type: DataTypes.INTEGER
    },
    data: {
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
    schema: 'processes'
  })

  model.associate = function (models) {
    model.hasOne(models.PROCESSES.PROCESS, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'idProcess' // <-- tabla actual
    })
    model.hasOne(models.SECURITY.USERS, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'createdUser' // <-- tabla actual
    })
  }

  return model
}
