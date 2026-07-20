# Previsão Tempo Pescaria — Executar no seu Notebook (Opção C: Local)

Você já tem **Node.js**, **Python** e **MongoDB** instalados. Siga os passos abaixo.

Stack: React (frontend, porta 3000) + FastAPI (backend, porta 8001) + MongoDB (porta 27017).
> É necessário ter **internet** no notebook: os dados vêm do Open-Meteo e o mapa do Windy.

---

## 1) Obter o código
Baixe o projeto do Emergent (via "Save to GitHub" e depois `git clone`, ou download do código).
Você terá uma pasta com `backend/` e `frontend/`.

---

## 2) MongoDB
Garanta que o MongoDB está rodando localmente:
```bash
# Linux/Mac (exemplo)
mongod --dbpath /caminho/para/seus/dados
# ou, se instalado como serviço:
sudo systemctl start mongod        # Linux
brew services start mongodb-community   # Mac
# Windows: inicie o serviço "MongoDB" pelo Serviços do Windows
```
Ele deve ficar acessível em `mongodb://localhost:27017`.

---

## 3) Backend (FastAPI)
```bash
cd backend

# criar ambiente virtual
python -m venv venv
# ativar:
source venv/bin/activate          # Linux/Mac
# venv\Scripts\activate           # Windows (PowerShell/CMD)

# instalar dependências
pip install -r requirements.txt
```

> Observação: o arquivo `requirements.txt` inclui `emergentintegrations`, que **NÃO é usado** por este app.
> Se der erro ao instalar, remova essa linha do `requirements.txt` e rode `pip install -r requirements.txt` novamente.

Crie o arquivo **`backend/.env`** com:
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="previsao_pescaria"
CORS_ORIGINS="*"
```

Inicie o backend:
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```
Teste em: http://localhost:8001/api/  → deve responder `{"message":"Mare Alta API online"}`

---

## 4) Frontend (React)
Em outro terminal:
```bash
cd frontend
```

Crie/edite o arquivo **`frontend/.env`** apontando para o backend local:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```
> Importante: no ambiente Emergent esse valor aponta para a URL do preview.
> Para rodar local, ele PRECISA ser `http://localhost:8001`.

Instale e inicie (use **yarn**):
```bash
yarn install
yarn start
```
Abra: **http://localhost:3000**

---

## 5) Pronto!
- Frontend: http://localhost:3000
- Backend/API: http://localhost:8001/api

### Dicas de problemas comuns
- **Tela sem dados**: confirme que `frontend/.env` tem `REACT_APP_BACKEND_URL=http://localhost:8001` e reinicie o `yarn start`.
- **Erro de conexão com banco**: confirme que o MongoDB está ativo em `localhost:27017`.
- **Sem previsão / erro 502**: verifique a conexão de internet (o app consulta o Open-Meteo).
- **`yarn` não encontrado**: instale com `npm install -g yarn`.
