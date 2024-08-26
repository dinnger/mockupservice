import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('users_local', {
    alias: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING
    },
    lastName: {
      type: DataTypes.STRING
    },
    password: {
      type: DataTypes.STRING
    },
    active: {
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

  return model
}
