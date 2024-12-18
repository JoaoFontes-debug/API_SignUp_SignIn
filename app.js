const express = require('express');
const app = express();
const sequelize = require('./databaseConfig');
const bcrypt =  require('bcrypt');
const jwt = require('jsonwebtoken');

const PORT = 3000;

const Pessoa = require('./models/Pessoa');
const Diario = require('./models/Diario');
const { Op } = require('sequelize');


app.use(express.json());

//sicroniza a tabelas com os modelos
sequelize.sync()
    .then(() => {
        console.log('Todas as tabelas foram sincronizadas com sucesso');
    })
    .catch(err => console.error('Erro ao sincronizar tabelas:', err));

// Rota para listar pessoas
app.get('/', async (req, res) => {
    try {
        const pessoas = await Pessoa.findAll({
            attributes: ['nome', 'email', 'senha'],
        });
        res.json({ pessoas });

    } catch (error) {
        console.error("Erro ao selecionar pessoas: ", error.message);
        res.status(500).send("<h1> Erro ao gerar a página de pessoas</h1>");
    }
});


// CRIA CONTA
app.post('/registro', async (req, res) => {
    const { nome, email, senha } = req.body; 
    
    if (!nome || !email || !senha) {
        return res.status(400).json({ error: "Campos obrigatórios: nome, email, senha." });
    }

    //cria uma sequencia aleatoria
    const salt = await bcrypt.genSalt(10);
    //junta a senha digitada no formulario e o salt
    const hashedSenha = await bcrypt.hash(senha, salt);

    try {
        const pessoa = await Pessoa.create({ nome, email, senha:hashedSenha });
        res.status(201).json({message:`${pessoa} acabou de ser criada`});
    } catch (error) {
        console.error("Erro ao criar pessoas: ", error.message);
        res.status(500).json({ error: "Erro ao criar pessoa." });
    }
});


//////////////////ROTAS DIARIOS///////////////////////

//LISTA DIARIOS
app.get('/listarDiarios', async (req, res) => {
    try {
        const diarios = await Diario.findAll({
            attributes: ['titulo', 'descricao'],
        });
        res.json({ diarios });

    } catch (error) {
        console.error("Erro ao selecionar diarios: ", error.message);
        res.status(500).send("<h1> Erro ao gerar a página de pessoas</h1>");
    }
});

//CRIA DIARIOS
app.post('/criarDiario', async (req, res) => {
    const { titulo, descricao} = req.body; 
    
    if (!titulo || !descricao) {
        return res.status(400).json({ error: "Campos obrigatórios: titulo e descrição." });
    }

    try {
        const diario = await Diario.create({ titulo, descricao });
        res.status(201).json({msg:`Um diario acabou de ser criado`});

    } catch (error) {
        console.error("Erro ao criar diario: ", error.message);
        res.status(500).json({ error: "Erro ao criar diario: "});
    }
});

//BUSCAR UM DIARIO POR TITULO
app.get('/listar/diario/:titulo', async (req,res)=>{
    const {titulo} = req.params;

    try {
        //busca a palavra em titulo e descrição
        const diario = await Diario.findAll({
            where:{
                [Op.or]: [
                    {titulo: {[Op.like]: `%${titulo}%`}},
                    {descricao: {[Op.like]: `%${titulo}%`}}
                ]
            }
        });
        res.status(200).json(diario);

    } catch (error) {
        console.log("diario não encontrado:", error.message);
        res.status(500).json({Error: error.message});
    }
})

//DELETAR UM DIARIO - funçao do botão
app.delete('/lista/diario/excluir/:id', async (req,res)=>{
    const { id }= req.params;

    try {
        const diario = await Diario.findByPk(id);

        if(diario){
            await diario.destroy()
            res.status(200).json({mensagem:"Excluido com sucesso"})
        }else{
            res.status(404).json({mensagem:"diario não encontrado"})
        }
    } catch (error) {
        res.status(500).json({error:error.message})
    }
    
})



// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
