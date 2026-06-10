# 🧠 NeoMind

> Plataforma web de estudos gamificada para o Ensino Médio e ENEM — powered by IA.

O NeoMind transforma o ato de estudar em uma experiência progressiva e recompensadora: o aluno lê um capítulo gerado por inteligência artificial, responde a uma questão inédita, acumula XP e desbloqueia níveis de dificuldade mais altos. O visual é inspirado em dashboards de jogos de carta estilo FIFA Ultimate Team, com paleta escura, efeitos neon e animações cinematográficas.

---

## ✨ Funcionalidades

- 📖 **Capítulos didáticos gerados por IA** — personalizados pelo interesse do aluno (RPG, animes, esportes)
- ❓ **Questões inéditas de múltipla escolha** — criadas com base no conteúdo lido
- 🎮 **Sistema de gamificação com XP e níveis** — Novato → Intermediário → PRO
- 🔒 **Desbloqueio progressivo de conteúdo** — módulos avançados exigem XP acumulado
- 📊 **Histórico de respostas** — registro completo de acertos e erros
- 👤 **Perfil customizável** — foto, recado e interesse temático
- ⚡ **Renderização de fórmulas matemáticas** — via KaTeX

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python + Flask |
| Banco de dados | SQLite via SQLAlchemy |
| Inteligência Artificial | Groq API — modelo `llama-3.1-8b-instant` |
| Frontend | HTML + Jinja2 + CSS puro + JavaScript puro |
| Fórmulas matemáticas | KaTeX (CDN) |

---

## 📁 Estrutura do Projeto

```
mvvc/
├── app.py                    ← Toda a lógica do servidor (rotas, IA, banco)
├── conteudos_dados.py        ← Catálogo de matérias e tópicos
├── database.db               ← Banco SQLite (gerado automaticamente)
├── static/
│   ├── style.css
│   ├── dashboard-fut.css / .js
│   ├── materias-fut.css / .js
│   ├── conteudos-fut.css / .js
│   ├── livro-fut.css / .js
│   ├── app.js
│   └── uploads/              ← Fotos de perfil dos usuários
└── templates/
    ├── login.html
    ├── register.html
    ├── dashboard.html
    ├── materias.html
    ├── conteudos.html
    ├── livro.html
    ├── questoes_sistema.html
    ├── historico.html
    └── perfil.html
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- Python 3.8 ou superior
- Chave de API da Groq — obtenha gratuitamente em [console.groq.com](https://console.groq.com)

### Passo a passo

**1. Clone o repositório**

```bash
git clone https://github.com/seu-usuario/neomind.git
cd neomind
```

**2. Crie e ative um ambiente virtual**

```bash
# Linux / macOS
python -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

**3. Instale as dependências**

```bash
pip install flask flask-sqlalchemy groq werkzeug
```

**4. Configure a chave da API Groq**

Abra o arquivo `app.py` e localize a linha:

```python
groq_client = Groq(api_key="")
```

Substitua `""` pela sua chave de API:

```python
groq_client = Groq(api_key="sua_chave_aqui")
```

**5. Execute a aplicação**

```bash
python app.py
```

**6. Acesse no navegador**

```
http://localhost:5000
```

> O banco de dados (`database.db`) e a pasta `static/uploads/` são criados automaticamente na primeira execução.

---

## 🎓 Fluxo de Uso

```
Cadastro → Login → Dashboard → Escolher Matéria
    → Escolher Tópico + Nível → Ler Capítulo (IA)
        → Responder Questão (IA) → Ganhar XP → Desbloquear novos níveis
```

### Matérias disponíveis

Biologia · Filosofia · Física · Geografia · História · Matemática · Português · Química

### Níveis e requisitos de XP

| Nível | XP necessário | Conteúdo desbloqueado |
|-------|:---:|---|
| 🟢 Novato | 0 | Conceitos elementares e introdutórios |
| 🔵 Intermediário | 50 XP | Propriedades algébricas e aprofundamento |
| 🟣 PRO | 100 XP | Teoria abstrata e demonstrações rigorosas |

Cada questão acertada vale **+10 XP**. Não há penalidade por errar.

---

## ⚙️ Personalização da IA

No cadastro, o aluno escolhe seu **interesse temático**. A IA usa essa informação para personalizar todos os textos e questões:

- **RPG** — conceitos explicados com mecânicas de atributos, sistemas de dano e magia
- **Animes de batalha** — analogias com poderes, treinamentos e estratégias de combate
- **Estatísticas esportivas** — exemplos com probabilidades, métricas e desempenho atlético

---

## ⚠️ Pontos de Atenção (MVP)

> Este projeto é um MVP de demonstração. Para uso em produção, considere os seguintes pontos:

- **Senhas em texto puro** — implemente hash com `werkzeug.security` (`generate_password_hash` / `check_password_hash`)
- **Secret key exposta** — mova para variável de ambiente (`.env`)
- **Cache de conteúdo IA** — o conteúdo gerado é cacheado apenas na sessão Flask; um cache persistente em banco eliminaria chamadas redundantes
- **Chave de API no código** — use variáveis de ambiente em produção

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
