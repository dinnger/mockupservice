import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('process', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    idNamespace: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.STRING
    },
    data: {
      type: DataTypes.JSONB
    },
    version: {
      type: DataTypes.INTEGER
    },
    image: {
      type: DataTypes.TEXT
    },
    git: {
      type: DataTypes.JSONB
    },
    deploy: {
      type: DataTypes.JSONB
    },
    active: {
      type: DataTypes.BOOLEAN
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
    model.hasOne(models.PROCESSES.PROCESS_NAMESPACES, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'idNamespace' // <-- tabla actual
    })

    model.hasOne(models.SECURITY.USERS, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'createdUser' // <-- tabla actual
    })
  }

  return model
}
