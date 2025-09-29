// import { Request, Response } from 'express'
// import { db } from '../database/banco-mongo.js'
// import bcrypt from 'bcrypt'
// class UsuariosController {
//     async adicionar(req: Request, res: Response) {
//         const { nome, idade, email, senha } = req.body
//         if (!nome || !idade || !email || !senha)
//             return res.status(400).json({ error: "Nome, idade, email e senha são obrigatórios" })
//         if (senha.length < 6)
//             return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" })
//         if (!email.includes('@') || !email.includes('.'))
//             return res.status(400).json({ error: "Email inválido" })

//         const senhaCriptografada = await bcrypt.hash(senha, 10)
//         const usuario = { nome, idade, email, senha: senhaCriptografada }

//         const resultado = await db.collection('usuarios').insertOne(usuario)
//         res.status(201).json({nome,idade,email,_id: resultado.insertedId })
//     }
//     async listar(req: Request, res: Response) {
//         const usuarios = await db.collection('usuarios').find().toArray()
//         const usuariosSemSenha = usuarios.map(({ senha, ...resto }) => resto)
//         res.status(200).json(usuariosSemSenha)
//     }
// }

// export default new UsuariosController()

import { Request, Response } from 'express'
import { db } from '../database/banco-mongo.js'
import bcrypt from 'bcrypt'

class UsuariosController {
    /**
     * Adiciona um novo usuário, com validação e criptografia de senha.
     */
    async adicionar(req: Request, res: Response) {
        try {
            const { nome, idade, email, senha } = req.body

            // --- Validações de entrada ---
            if (!nome || !idade || !email || !senha) {
                return res.status(400).json({ error: "Nome, idade, email e senha são obrigatórios" })
            }
            if (senha.length < 6) {
                return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" })
            }
            if (!email.includes('@') || !email.includes('.')) {
                return res.status(400).json({ error: "Email inválido" })
            }

            // --- Verificação de e-mail duplicado ---
            const usuarioExistente = await db.collection('usuarios').findOne({ email })
            if (usuarioExistente) {
                return res.status(409).json({ error: "Este e-mail já está em uso." }) // 409 Conflict
            }

            // --- Lógica de criação ---
            const senhaCriptografada = await bcrypt.hash(senha, 10)
            const novoUsuario = { nome, idade, email, senha: senhaCriptografada, dataCriacao: new Date() }

            const resultado = await db.collection('usuarios').insertOne(novoUsuario)

            // Retorna o usuário criado sem a senha
            res.status(201).json({ nome, idade, email, _id: resultado.insertedId })

        } catch (error) {
            console.error("Erro ao adicionar usuário:", error)
            res.status(500).json({ error: "Ocorreu um erro no servidor ao adicionar usuário." })
        }
    }

    /**
     * Lista todos os usuários, removendo o campo de senha da resposta.
     */
    async listar(req: Request, res: Response) {
        try {
            const usuarios = await db.collection('usuarios').find().toArray()
            
            // Mapeia os usuários para remover o campo 'senha' por segurança
            const usuariosSemSenha = usuarios.map(({ senha, ...resto }) => resto)

            res.status(200).json(usuariosSemSenha)
        } catch (error) {
            console.error("Erro ao listar usuários:", error)
            res.status(500).json({ error: "Ocorreu um erro no servidor ao listar usuários." })
        }
    }
}

export default new UsuariosController()