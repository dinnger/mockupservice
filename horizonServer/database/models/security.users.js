import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('users', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    alias: {
      type: DataTypes.STRING
    },
    avatar: {
      type: DataTypes.TEXT
    },
    google: {
      type: DataTypes.JSONB
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    lastLogin: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    jira: {
      type: DataTypes.JSONB
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
    model.hasOne(models.SECURITY.USERS_NAMESPACES, {
      foreignKey: 'userId', // <-- otra tabla
      sourceKey: 'id' // <-- tabla actual
    })

    model.hasOne(models.SECURITY.USERS_PROJECTS, {
      foreignKey: 'userId', // <-- otra tabla
      sourceKey: 'id' // <-- tabla actual
    })

    model.hasMany(models.SECURITY.USERS_ROLES, {
      foreignKey: 'userId', // <-- otra tabla
      sourceKey: 'id' // <-- tabla actual
    })

    model.hasMany(models.FLOWS.FLOW_DEPLOY_LOCAL, {
      foreignKey: 'createdUser', // <-- otra tabla
      sourceKey: 'id' // <-- tabla actual
    })

    // model.hasMany(models.FLOWS, {
    //   foreignKey: 'createdUser', // <-- otra tabla
    //   sourceKey: 'id' // <-- tabla actual
    // })
  }

  return model
}
