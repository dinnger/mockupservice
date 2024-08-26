import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('flow', {
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
    flow: {
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
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    privacy: {
      type: DataTypes.JSONB
    },
    deploy: {
      type: DataTypes.JSONB
    },
    deployDir: {
      type: DataTypes.STRING
    },
    deployParameters: {
      type: DataTypes.JSONB
    },
    isTemplate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    },
    ownerUser: {
      type: DataTypes.INTEGER
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
    model.hasOne(models.FLOWS.FLOW_NAMESPACES, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'idNamespace' // <-- tabla actual
    })

    model.hasMany(models.FLOWS.FLOW_DOC, {
      foreignKey: 'idFlow', // <-- otra tabla
      sourceKey: 'id' // <-- tabla actual
    })

    model.hasMany(models.FLOWS.FLOW_DEPLOY_LOCAL, {
      foreignKey: 'idFlow', // <-- otra tabla
      sourceKey: 'id' // <-- tabla actual
    })

    model.hasOne(models.SECURITY.USERS, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'ownerUser' // <-- tabla actual
    })

    // model.hasOne(models.SECURITY.USERS, {
    //   as: 'owner',
    //   foreignKey: 'id', // <-- otra tabla
    //   sourceKey: 'ownerUser' // <-- tabla actual
    // })
  }

  return model
}
