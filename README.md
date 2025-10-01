# Projeto Node.js Moderno

Este projeto é uma refatoração de um projeto Node.js existente, aplicando boas práticas de arquitetura e desenvolvimento, como separação de responsabilidades (camadas de serviço, controlador, modelo), validação de dados, tratamento de erros centralizado e uso de um ORM (Sequelize com SQLite) para persistência de dados.

## Arquitetura

A arquitetura do projeto segue um padrão modular, com as seguintes pastas principais:

```
/
|-- src/
|   |-- api/
|   |   |-- routes/             # Definição das rotas da API
|   |   |-- middlewares/        # Middlewares de autenticação, etc.
|   |   |-- validators/         # Validação de dados de entrada com Joi
|   |-- config/                 # Configurações do projeto (ex: banco de dados)
|   |-- controllers/            # Lógica de manipulação de requisições e respostas
|   |-- services/               # Lógica de negócio principal
|   |-- models/                 # Definição dos modelos de dados (Sequelize)
|   |-- utils/                  # Funções utilitárias (ex: tratamento de erros)
|-- .env                        # Variáveis de ambiente
|-- package.json                # Dependências e scripts do projeto
|-- server.js                   # Ponto de entrada da aplicação
```

## Tecnologias Utilizadas

*   **Node.js**: Ambiente de execução JavaScript.
*   **Express**: Framework web para Node.js.
*   **Sequelize**: ORM para Node.js, utilizado com SQLite para persistência de dados.
*   **bcryptjs**: Para hashing de senhas.
*   **jsonwebtoken**: Para autenticação JWT.
*   **dotenv**: Para gerenciar variáveis de ambiente.
*   **Joi**: Para validação de esquemas de dados.

## Configuração do Ambiente

1.  **Clone o repositório** (ou crie a estrutura de pastas manualmente).
2.  **Navegue até o diretório do projeto**:
    ```bash
    cd modern-node-app
    ```
3.  **Instale as dependências**:
    ```bash
    npm install
    ```
4.  **Crie um arquivo `.env`** na raiz do projeto com as seguintes variáveis:
    ```
    PORT=3000
    JWT_SECRET=sua_chave_secreta_aqui
    ```
    *Substitua `sua_chave_secreta_aqui` por uma string segura e complexa.*

## Como Rodar o Projeto

Para iniciar o servidor, execute:

```bash
node server.js
```

O servidor estará rodando em `http://localhost:3000` (ou na porta especificada no `.env`).

## Endpoints da API

### Usuários

*   **`POST /api/users/register`**
    *   **Descrição**: Registra um novo usuário e cria uma conta associada.
    *   **Corpo da Requisição**: `{ username, email, password }`
    *   **Exemplo de Resposta**: `{ message, token, user, account }`

*   **`POST /api/users/login`**
    *   **Descrição**: Autentica um usuário e retorna um token JWT.
    *   **Corpo da Requisição**: `{ username, password }`
    *   **Exemplo de Resposta**: `{ message, token, user }`

*   **`GET /api/users/me`**
    *   **Descrição**: Retorna os dados do usuário autenticado.
    *   **Autenticação**: Requer token JWT no cabeçalho `Authorization: Bearer <token>`.
    *   **Exemplo de Resposta**: `{ user }`

### Contas

*   **`GET /api/accounts/:userId`**
    *   **Descrição**: Retorna os detalhes da conta de um usuário específico.
    *   **Autenticação**: Requer token JWT.
    *   **Exemplo de Resposta**: `{ id, userId, accountNumber, balance, transferPassword }`

*   **`GET /api/accounts/:accountId/balance`**
    *   **Descrição**: Retorna o saldo de uma conta específica.
    *   **Autenticação**: Requer token JWT.
    *   **Exemplo de Resposta**: `{ balance }`

*   **`POST /api/accounts/set_transferPassword`**
    *   **Descrição**: Define ou atualiza a senha de transferência de uma conta.
    *   **Autenticação**: Requer token JWT.
    *   **Corpo da Requisição**: `{ accountNumber, transferPassword }`
    *   **Exemplo de Resposta**: `{ message }`

*   **`POST /api/accounts/change_transferPassword`**
    *   **Descrição**: Altera a senha de transferência de uma conta.
    *   **Autenticação**: Requer token JWT.
    *   **Corpo da Requisição**: `{ accountNumber, old_transferPassword, new_transferPassword }`
    *   **Exemplo de Resposta**: `{ message }`

*   **`POST /api/accounts/verify_transferPassword`**
    *   **Descrição**: Verifica a senha de transferência de uma conta.
    *   **Autenticação**: Requer token JWT.
    *   **Corpo da Requisição**: `{ accountNumber, transferPassword }`
    *   **Exemplo de Resposta**: `{ message }`

*   **`POST /api/accounts/transfer`**
    *   **Descrição**: Realiza uma transferência entre contas.
    *   **Autenticação**: Requer token JWT.
    *   **Corpo da Requisição**: `{ fromAccountNumber, toAccountNumber, transferPassword, amount }`
    *   **Exemplo de Resposta**: `{ message, fromAccount, toAccount }`

## Testes

*(Ainda não implementado, mas recomendado para futuras melhorias.)*

## Contribuição

Sinta-se à vontade para contribuir com melhorias, correções de bugs ou novas funcionalidades. Por favor, siga as boas práticas de desenvolvimento e crie pull requests claras e concisas.

