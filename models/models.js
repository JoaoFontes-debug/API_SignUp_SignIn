const {DataTypes} = require('sequelize');
const sequelize = require('../databaseConfig');


const Pessoa = sequelize.define('Pessoa', {
    Pk_pessoa:{
        type: DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    nome:{
        type: DataTypes.STRING,
        allowNull: false
    },
    email:{
        type: DataTypes.STRING, unique:true,
        allowNull: false,
    },
    senha:{
        type: DataTypes.STRING,
        allowNull: false
    }
  
})


const Diario = sequelize.define('Diario', {
    Pk_diario:{
        type: DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    titulo:{
        type: DataTypes.STRING,
        allowNull: false
    },
    descricao:{
        type: DataTypes.TEXT, 
        allowNull: false
    },
    Fk_pessoa:{
        type: DataTypes.INTEGER,
        allowNull: false, // Chave estrangeira obrigatória
        references: {
          model: 'Pessoas', // Nome da tabela Pessoa
          key: 'Pk_pessoa', // Campo que será referenciado
        }
    }
});


//configura o relacionamento
Pessoa.hasMany(Diario, {
    foreignKey: 'Fk_pessoa', // Nome da chave estrangeira
    sourceKey: 'Pk_pessoa', // Chave primária em Pessoa
    as: 'diarios',
  });
  
  Diario.belongsTo(Pessoa, {
    foreignKey: 'Fk_pessoa', // Nome da chave estrangeira
    targetKey: 'Pk_pessoa', // Chave primária em Pessoa
    as: 'autor',
  });
module.exports = {Pessoa, Diario};