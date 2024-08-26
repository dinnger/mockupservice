import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('process_deploy', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.STRING
    },
    url: {
      type: DataTypes.STRING
    },
    namespace: {
      type: DataTypes.STRING
    },
    token: {
      type: DataTypes.STRING
    },
    dir: {
      type: DataTypes.STRING
    },
    primaryBranch: {
      type: DataTypes.STRING,
      defaultValue: 'master'
    },
    branches: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      default: ['dev', 'qa']
    },
    deployBranch: {
      type: DataTypes.STRING
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
    schema: 'processes'
  })

  model.associate = function (models) {
    model.hasOne(models.SECURITY.USERS, {
      foreignKey: 'id', // <-- otra tabla
      sourceKey: 'createdUser' // <-- tabla actual
    })
  }

  return model
}
