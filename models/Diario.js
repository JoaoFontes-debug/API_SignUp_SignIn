const {DataTypes} = require('sequelize');
const sequelize = require('../databaseConfig');

const Diario = sequelize.define('Diario', {
    titulo:{
        type: DataTypes.STRING,
        allowNull: false
    },
    descricao:{
        type: DataTypes.TEXT, 
        allowNull: false
    }
  
});

module.exports = Diario;