import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('table', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    idSchema: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING
    },
    fields: {
      type: DataTypes.JSONB
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
    schema: 'databases'
  })

  model.associate = function (models) {

  }

  return model
}
