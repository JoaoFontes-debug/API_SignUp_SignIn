const express = require('express');
const sequelize = require('./databaseConfig');
const bcrypt =  require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const { Op } = require('sequelize');

const app = express();

const secretKey = process.env.SECRET_KEY;
const PORT = 3000;

const{ Pessoa, Diario }= require('./models/models');


app.use(cors());
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
app.post('/cadastro', async (req, res) => {
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
        res.status(201).json({message:`O usuário${pessoa.nome} acabou de ser criado`});
    } catch (error) {
        console.error("Erro ao criar pessoas: ", error.message);
        res.status(500).json({ error: "Erro ao criar pessoa." });
    }
});


app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: "Campos obrigatórios: email e senha." });
    }

    try {
        // Buscar o usuário pelo email
        const pessoa = await Pessoa.findOne({ where: { email } });

        if (!pessoa) {
            return res.status(404).json({ error: "Email ou senha inválidos." });
        }
        // Verificar se a senha está correta
        const senhaCorreta = await bcrypt.compare(senha, pessoa.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ error: "Email ou senha inválidos." });
        }

        // Gerar o token JWT
        const token = jwt.sign({ 
            id: pessoa.Pk_pessoa, 
            email: pessoa.email }, // Payload
            secretKey, // Chave secreta
            { expiresIn: '5m' } // Tempo de expiração do token
        );
        res.status(200).json({ token, id: pessoa.Pk_pessoa, message: "Login realizado com sucesso!" });

    } catch (error) {
        console.error("Erro no login:", error.message);
        res.status(500).json({ error: "Erro no login." });

    }


});

const autenticaJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Token não fornecido." });
    }

    const token = authHeader.split(' ')[1]; // O token vem no formato "Bearer <token>"

    jwt.verify(token, secretKey, (err, usuario) => {
        if (err) {
            return res.status(403).json({ error: "Token inválido ou expirado." });
        }

        req.usuario = usuario; // Anexa o usuário autenticado à requisição
        next();
    });
};


//////////////////ROTAS DIARIOS///////////////////////

//LISTA DIARIOS
app.get('/listarDiarios', autenticaJWT, async (req, res) => {
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
app.post('/criarDiario', autenticaJWT, async (req, res) => {
    const {titulo, descricao} = req.body; 

    if (!titulo || !descricao) {
        return res.status(400).json({ error: "Campos obrigatórios: titulo e descrição." });
    }

    try {
        const diario = await Diario.create({
            titulo, 
            descricao,
            Fk_pessoa: req.usuario.id
        });
        res.status(201).json({message:`O diario ${diario.titulo} acabou de ser criado`});

    } catch (error) {
        console.error("Erro ao criar diario: ", error.message);
        res.status(500).json({ error: "Erro ao criar diario: "});
    }
});

//BUSCAR UM DIARIO POR TITULO
app.get('/listar/diario/:titulo', autenticaJWT, async (req,res)=>{
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

//EDITA O DIARIO
app.put('/editar/:id', async (req, res) => { 
    //dados vindos do formulario
    const { titulo, descricao } = req.body; 

    const descricaoId = req.params.id; 
    
    try { 
        const diario = await Diario.findByPk(descricaoId); 

    if (diario) { 
        console.log("tem diario")
       diario.titulo = titulo; 
       diario.descricao = descricao;

       await diario.save(); 
       res.json(diario); 
    } 
    else { 
        res.status(404).send('Erro ao atualizar o diario'); 
    } 

} catch (error) { 
    console.error(error); 
    res.status(500).send('Erro ao atualizar o diario'); 
} });


//DELETAR UM DIARIO - funçao do botão
app.delete('/lista/diario/excluir/:id',autenticaJWT, async (req,res)=>{
    const { id }= req.params;

    try {
        const diario = await Diario.findByPk(id);

        if(diario){
            await diario.destroy();
            res.status(200).json({message:`Diário ${diario.titulo} excluido com sucesso`})
        }else{
            res.status(404).json({message:"diario não encontrado"})
        }
    } catch (error) {
        res.status(500).json({error:error.message})
    }
    
})


// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
