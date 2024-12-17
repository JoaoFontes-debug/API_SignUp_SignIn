const {DataTypes} = require('sequelize');
const sequelize = require('../databaseConfig');

const pessoa = sequelize.define('Pessoa', {
    nome:{
        type: DataTypes.STRING,
        allowNull: false
    },
    email:{
        type: DataTypes.STRING,
        allowNull: false
    }
})

sequelize.sync({force:true})
            .then(() => console.log(`Tabela produtos sincronizada`))
            .catch(err => console.log(`Erro ao sincronizar a tabela`))

module.exports = produto;