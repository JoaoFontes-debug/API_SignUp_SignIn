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
    //TESTE
    console.log(salt);
    //junta a senha digitada no formulario e o salt
    const hashedSenha = await bcrypt.hash(senha, salt);
    //TESTE
    console.log(hashedSenha);
    try {
        const pessoa = await Pessoa.create({ nome, email, senha:hashedSenha });
        res.status(201).json({message:`O usuário ${ pessoa.nome} acabou de ser criado`});
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
        //TESTE
        console.log(pessoa);
        if (!pessoa) {
            return res.status(404).json({ error: "Email ou senha inválidos." });
        }
        // Verificar se a senha está correta
        const senhaCorreta = await bcrypt.compare(senha, pessoa.senha);
        //TESTE
        console.log("senha correta", senhaCorreta);

        if (!senhaCorreta) {
            return res.status(401).json({ error: "Email ou senha inválidos." });
        }

        // Gerar o token JWT
        const token = jwt.sign({ 
            id: pessoa.Pk_pessoa, 
            email: pessoa.email }, 
            secretKey, 
            { expiresIn: '30m' } 
        );
        res.status(200).json({ token, id: pessoa.Pk_pessoa, message: "Login realizado com sucesso!" });

    } catch (error) {
        console.error("Erro no login:", error.message);
        res.status(500).json({ error: "Erro no login." });

    }


});

const autenticaJWT = (req, res, next) => {
    const TESTE = req.header('Authorization');
    //TESTE
    console.log("req.heder: ", TESTE);
    const token = req.header('Authorization').replace('Bearer ', '');
    //TESTE
    console.log("token puro:", token);
    if (!token) {
      return res.status(401).send({ error: 'Token não fornecido' });
    }
  
    try {
      const decoded = jwt.verify(token, secretKey);
      //TESTE
        console.log("token decodificado", decoded);

      req.usuario = decoded;
      next();
    } catch (error) {
      res.status(401).send({ error: 'Token inválido' });
    }
  };

//////////////////ROTAS DIARIOS///////////////////////

// LISTA DIARIOS
app.get('/listarDiarios', autenticaJWT, async (req, res) => {
    try {
        const diarios = await Diario.findAll({
            attributes: ['titulo', 'descricao'],
            where: {
                Fk_pessoa: req.usuario.id, // Filtra pelo ID do usuário autenticado
            },
        });
        res.json({ diarios });
    } catch (error) {
        console.error("Erro ao selecionar diários: ", error.message);
        res.status(500).send("<h1>Erro ao gerar a página de diários</h1>");
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
        //TESTE
        console.log(diario);
        res.status(201).json({message:`O diario ${diario.titulo} acabou de ser criado`});

    } catch (error) {
        console.error("Erro ao criar diario: ", error.message);
        res.status(500).json({ error: "Erro ao criar diario: "});
    }
});

//BUSCAR UM DIARIO POR TITULO
app.get('/listar/diario/:titulo', autenticaJWT, async (req,res)=>{
    const {titulo} = req.params;
    //TESTE
    console.log(req.params);

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

        if(diario.length === 0){
            return res.status(404).json({message: "Diário não encontrado."});
        }

        res.status(200).json(diario);

    } catch (error) {
        console.log("diario não encontrado:", error.message);
        res.status(500).json({Error: error.message});
    }
})

app.put('/editarDiario/:Pk_diario', autenticaJWT, async (req, res) => {
    const { titulo, descricao } = req.body;
    const { Pk_diario } = req.params ;
    //TESTE
    console.log("body no editar diario", req.body);
    console.log("params no editar diario", req.params);
    if (!titulo || !descricao) {
        return res.status(400).json({ message: "Título e descrição são obrigatórios." });
    }

    try {
        const diario = await Diario.findOne({ where: { Pk_diario, Fk_pessoa: req.usuario.id } });

        if (!diario) {
            return res.status(404).json({ message: "Diário não encontrado ou você não tem permissão para editá-lo." });
        }

        diario.titulo = titulo;
        diario.descricao = descricao;
        await diario.save();

        return res.status(200).json({ message: "Diário atualizado com sucesso.", diario });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao atualizar o diário." });
    }
});


//DELETAR UM DIARIO - funçao do botão
app.delete('/deletarDiario/:Pk_diario', autenticaJWT, async (req, res) => {
    const { Pk_diario } = req.params;

    try {
        const diario = await Diario.findOne({where:{ Pk_diario, Fk_pessoa: req.usuario.id }});

        if (diario) {
            await diario.destroy();
            return res.status(200).json({ message: `Diário "${diario.titulo}" excluído com sucesso.` });
        } else {
            return res.status(404).json({ message: "Diário não encontrado." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir o diário." });
    }
});


// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
