const {Sequelize} = require('sequelize');

const sequelize = new Sequelize({ 
    dialect: 'sqlite', 
    storage: './cadastros.db'
});

sequelize.authenticate()
            .then(() => console.log('Conexão estabelecida com sucesso'))
            .catch(err => console.log(`Não foi possivel conectar ao banco`,err));
            
module.exports = sequelize;