//criando banco de dados bancoaula
use ("bancoaula");

db.createCollection("produtos");

db.produtos.insertMany([
    {
        nome: "Camiseta",
        preco: 49.90,
        urlfoto: "https://example.com/camiseta.jpg",
        descricao: "Camiseta de algodão, disponível em várias cores e tamanhos."
    }
    ,{
        nome: "Calça Jeans",
        preco: 99.90,
        urlfoto: "https://example.com/calca-jeans.jpg", 
        descricao: "Calça jeans confortável e durável, perfeita para o dia a dia."
    }
])