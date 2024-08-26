import { DataTypes } from 'sequelize'

export const models = (sequelize) => {
  const model = sequelize.define('schema', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING
    },
    path: {
      type: DataTypes.STRING
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
    model.hasMany(models.DATABASES.TABLE, {
      foreignKey: 'idSchema', // <-- otra tabla
      sourceKey: 'id' // <-- tabla actual
    })
  }

  return model
}
