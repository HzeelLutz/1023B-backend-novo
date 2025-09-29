// import { Request, Response } from 'express'
// import { db } from '../database/banco-mongo.js'
// class ProdutosController {
//     async adicionar(req: Request, res: Response) {
//         const { nome, preco, urlfoto, descricao } = req.body
//         if (!nome || !preco || !urlfoto || !descricao)
//             return res.status(400).json({ error: "Nome, preço, urlfoto e descrição são obrigatórios" })

//         const produto = { nome, preco, urlfoto, descricao }
//         const resultado = await db.collection('produtos').insertOne(produto)
//         res.status(201).json({ nome, preco, urlfoto, descricao, _id: resultado.insertedId })
//     }
//     async listar(req: Request, res: Response) {
//         const produtos = await db.collection('produtos').find().toArray()
//         res.status(200).json(produtos)
//     }
// }

// export default new ProdutosController()

import { Request, Response } from 'express'
import { db } from '../database/banco-mongo.js'

class ProdutosController {
    /**
     * Adiciona um novo produto.
     */
    async adicionar(req: Request, res: Response) {
        try {
            const { nome, preco, urlfoto, descricao } = req.body

            if (!nome || !preco || !urlfoto || !descricao) {
                return res.status(400).json({ error: "Nome, preço, urlfoto e descrição são obrigatórios" })
            }

            const novoProduto = { nome, preco, urlfoto, descricao }
            const resultado = await db.collection('produtos').insertOne(novoProduto)

            res.status(201).json({ ...novoProduto, _id: resultado.insertedId })

        } catch (error) {
            console.error("Erro ao adicionar produto:", error)
            res.status(500).json({ error: "Ocorreu um erro no servidor ao adicionar produto." })
        }
    }

    /**
     * Lista todos os produtos.
     */
    async listar(req: Request, res: Response) {
        try {
            const produtos = await db.collection('produtos').find().toArray()
            res.status(200).json(produtos)
        } catch (error) {
            console.error("Erro ao listar produtos:", error)
            res.status(500).json({ error: "Ocorreu um erro no servidor ao listar produtos." })
        }
    }
}

export default new ProdutosController()