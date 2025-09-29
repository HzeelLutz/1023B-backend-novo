import { Request, Response } from "express";
import { db } from "../database/banco-mongo.js";
import { ObjectId } from "mongodb";

// Interface para definir a estrutura de um item no carrinho
interface ItemCarrinho {
    produtoId: string;
    quantidade: number;
    precoUnitario: number;
    nome: string;
}

// Interface para definir a estrutura do carrinho
interface Carrinho {
    _id?: ObjectId;
    usuarioId: string;
    itens: ItemCarrinho[];
    dataAtualizacao: Date;
    total: number;
}

class CarrinhoController {
    /**
     * Adiciona um item ao carrinho de um usuário.
     * Se o carrinho não existir, ele é criado.
     * Se o item já existir no carrinho, sua quantidade é incrementada.
     */
    async adicionarItem(req: Request, res: Response) {
        try {
            const { usuarioId, produtoId, quantidade } = req.body;

            // Validação básica da entrada
            if (!usuarioId || !produtoId || !quantidade || quantidade <= 0) {
                return res.status(400).json({ error: "Dados inválidos: usuarioId, produtoId e quantidade (maior que zero) são obrigatórios." });
            }

            // 1. Buscar o produto no banco de dados para obter nome e preço
            const produto = await db.collection('produtos').findOne({ _id: new ObjectId(produtoId) });
            if (!produto) {
                return res.status(404).json({ error: "Produto não encontrado." });
            }

            // 2. Verificar se um carrinho para o usuário já existe
            let carrinho = await db.collection('carrinhos').findOne({ usuarioId: usuarioId }) as Carrinho | null;

            if (carrinho) {
                // 3a. Se o carrinho existe, atualiza-o
                const itemExistenteIndex = carrinho.itens && Array.isArray(carrinho.itens)
                    ? carrinho.itens.findIndex(item => item.produtoId === produtoId)
                    : -1;

                if (carrinho.itens && itemExistenteIndex > -1) {
                    // Se o item já está no carrinho, apenas atualiza a quantidade
                    if (carrinho.itens && carrinho.itens[itemExistenteIndex]) {
                        carrinho.itens[itemExistenteIndex].quantidade += quantidade;
                    }
                } else if (carrinho.itens) {
                    // Se o item não está no carrinho, adiciona
                    carrinho.itens.push({
                        produtoId: produtoId,
                        quantidade: quantidade,
                        precoUnitario: produto.preco,
                        nome: produto.nome,
                    });
                }
                carrinho.dataAtualizacao = new Date();
            } else {
                // Se não existir, cria um novo carrinho
                carrinho = {
                    usuarioId: usuarioId,
                    itens: [{
                        produtoId: produtoId,
                        quantidade: quantidade,
                        precoUnitario: produto.preco,
                        nome: produto.nome,
                    }],
                    dataAtualizacao: new Date(),
                    total: 0 // O total será calculado a seguir
                };
            }

            // 4. Calcular o total do carrinho
            carrinho.total = carrinho.itens.reduce((soma, item) => {
                return soma + (item.quantidade * item.precoUnitario);
            }, 0);

            // 5. Salvar o carrinho no banco de dados (Update ou Insert)
            const resultado = await db.collection('carrinhos').updateOne(
                { usuarioId: usuarioId },
                { $set: carrinho },
                { upsert: true } // Opção upsert: cria se não existir, atualiza se existir
            );

            return res.status(200).json(carrinho);

        } catch (error) {
            console.error("Erro ao adicionar item ao carrinho:", error);
            // Verifica se o erro é por um ObjectId inválido
            if (error instanceof Error && error.message.includes("Argument passed in must be a string of 12 bytes or a string of 24 hex characters")) {
                 return res.status(400).json({ error: "Formato do produtoId inválido." });
            }
            return res.status(500).json({ error: "Ocorreu um erro no servidor." });
        }
    }

    /**
     * Remove um item específico do carrinho do usuário.
     */
    async removerItem(req: Request, res: Response) {
        try {
            const { usuarioId, produtoId } = req.body;

             if (!usuarioId || !produtoId) {
                return res.status(400).json({ error: "Dados inválidos: usuarioId e produtoId são obrigatórios." });
            }

            const carrinho = await db.collection('carrinhos').findOne({ usuarioId: usuarioId }) as Carrinho | null;

            if (!carrinho) {
                return res.status(404).json({ error: "Carrinho não encontrado." });
            }

            // Filtra os itens, removendo o produtoId especificado
            carrinho.itens = carrinho.itens.filter(item => item.produtoId !== produtoId);
            carrinho.dataAtualizacao = new Date();
            
            // Recalcula o total
            carrinho.total = carrinho.itens.reduce((soma, item) => soma + (item.quantidade * item.precoUnitario), 0);
            
            // Atualiza o carrinho no banco de dados
            await db.collection('carrinhos').updateOne({ usuarioId: usuarioId }, { $set: carrinho });

            return res.status(200).json(carrinho);

        } catch (error) {
            console.error("Erro ao remover item do carrinho:", error);
            return res.status(500).json({ error: "Ocorreu um erro no servidor." });
        }
    }

    /**
     * Atualiza a quantidade de um item específico no carrinho.
     * Se a quantidade for 0 ou menor, o item é removido.
     */
    async atualizarQuantidade(req: Request, res: Response) {
        try {
            const { usuarioId, produtoId, quantidade } = req.body;
             
            if (!usuarioId || !produtoId || quantidade === undefined) {
                return res.status(400).json({ error: "Dados inválidos: usuarioId, produtoId e quantidade são obrigatórios." });
            }
            
            const carrinho = await db.collection('carrinhos').findOne({ usuarioId: usuarioId }) as Carrinho | null;
            if (!carrinho) {
                return res.status(404).json({ error: "Carrinho não encontrado." });
            }

            const itemIndex = carrinho.itens.findIndex(item => item.produtoId === produtoId);
            if (itemIndex === -1) {
                return res.status(404).json({ error: "Item não encontrado no carrinho." });
            }

            if (quantidade > 0) {
                // Atualiza a quantidade se for maior que 0
                if (carrinho.itens && carrinho.itens[itemIndex]) {
                    carrinho.itens[itemIndex].quantidade = quantidade;
                }
            } else {
                // Remove o item se a quantidade for 0 ou menor
                if (carrinho.itens) {
                    carrinho.itens.splice(itemIndex, 1);
                }
            }

            carrinho.dataAtualizacao = new Date();
            carrinho.total = carrinho.itens.reduce((soma, item) => soma + (item.quantidade * item.precoUnitario), 0);

            await db.collection('carrinhos').updateOne({ usuarioId: usuarioId }, { $set: carrinho });

            return res.status(200).json(carrinho);

        } catch (error) {
             console.error("Erro ao atualizar quantidade do item:", error);
            return res.status(500).json({ error: "Ocorreu um erro no servidor." });
        }
    }

    /**
     * Lista o conteúdo do carrinho para um usuário específico.
     */
    async listar(req: Request, res: Response) {
        try {
            const { usuarioId } = req.params; // Pega o id da URL
            const carrinho = await db.collection('carrinhos').findOne({ usuarioId: 123 });

            if (!carrinho) {
                return res.status(404).json({ error: "Carrinho não encontrado para este usuário." });
            }

            return res.status(200).json(carrinho);
        } catch (error) {
            console.error("Erro ao listar carrinho:", error);
            return res.status(500).json({ error: "Ocorreu um erro no servidor." });
        }
    }

    /**
     * Remove completamente o carrinho de um usuário.
     */
    async remover(req: Request, res: Response) {
        try {
            const { usuarioId } = req.params;
            const resultado = await db.collection('carrinhos').deleteOne({ usuarioId: 123 });

            if (resultado.deletedCount === 0) {
                 return res.status(404).json({ error: "Carrinho não encontrado para ser removido." });
            }

            // Retorna 204 No Content, um padrão para sucesso em operações de delete sem retorno de conteúdo.
            return res.status(204).send();

        } catch (error) {
            console.error("Erro ao remover carrinho:", error);
            return res.status(500).json({ error: "Ocorreu um erro no servidor." });
        }
    }
}

export default new CarrinhoController();