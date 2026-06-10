import os
import random
import json  # Processa o JSON gerado pela IA
from flask import Flask, render_template, request, redirect, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename

# SDK da Groq
from groq import Groq

# IMPORTAÇÃO DO SEU ARQUIVO DE CONTEÚDO
from conteudos_dados import CONTEUDO_PLATAFORMA

# ==========================================
# INICIALIZAÇÃO DO FLASK E CONFIGURAÇÕES
# ==========================================

app = Flask(__name__)

# CONFIGURAÇÃO DO BANCO SQLITE
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# CHAVE DE SESSÃO
app.secret_key = 'mvp_edtech'

# CONFIGURAÇÃO DE UPLOAD DE FOTOS
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Limita o upload a 16MB

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# INICIALIZA SQLALCHEMY
db = SQLAlchemy(app)

# INICIALIZA O CLIENTE DA GROQ
groq_client = Groq(api_key="")


# ==========================================
# MODEL USUARIO (Com Perfil e XP)
# ==========================================

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(100), unique=True, nullable=False)
    senha = db.Column(db.String(100), nullable=False)
    
    # Gosto do usuário (animes, jogos ou esportes)
    interesse = db.Column(db.String(50), nullable=False)
    
    # Campos para o perfil customizado
    recado = db.Column(db.String(300), nullable=True, default="Olá! Estou focado nos meus estudos.")
    foto = db.Column(db.String(200), nullable=True, default="default.png")
    
    # Sistema de Gamificação (Pontos acumulados)
    pontos = db.Column(db.Integer, nullable=False, default=0)

    # Retorna dinamicamente a faixa de nível com base no XP acumulado
    @property
    def nivel(self):
        if self.pontos < 50:
            return 'novato'
        elif self.pontos < 100:
            return 'intermediario'
        else:
            return 'pro'


# ==========================================
# MODEL HISTORICO
# ==========================================

class Historico(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(100), nullable=False)
    pergunta = db.Column(db.String(200), nullable=False)
    resultado = db.Column(db.String(50), nullable=False)


# ==========================================
# CRIA O BANCO AUTOMATICAMENTE
# ==========================================

with app.app_context():
    db.create_all()


# ==========================================
# ROTAS DE AUTENTICAÇÃO E HOME
# ==========================================

@app.route('/')
def home():
    if 'usuario' in session:
        return redirect('/dashboard')
    return redirect('/login')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        usuario = request.form.get('usuario')
        senha = request.form.get('senha')
        interesse = request.form.get('interesse')

        usuario_existente = Usuario.query.filter_by(usuario=usuario).first()
        if usuario_existente:
            return 'Usuário já existe'

        novo_usuario = Usuario(usuario=usuario, senha=senha, interesse=interesse)
        db.session.add(novo_usuario)
        db.session.commit()
        return redirect('/login')

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form.get('usuario')
        senha = request.form.get('senha')

        usuario_encontrado = Usuario.query.filter_by(usuario=usuario, senha=senha).first()
        if usuario_encontrado:
            session['usuario'] = usuario
            return redirect('/dashboard')
        return 'Login inválido'

    return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()  # Limpa toda a sessão do usuário
    return redirect('/login')


@app.route('/dashboard')
def dashboard():
    if 'usuario' not in session:
        return redirect('/login')
    
    # Buscando o objeto completo do usuário para evitar problemas no painel
    usuario_atual = Usuario.query.filter_by(usuario=session['usuario']).first()
    return render_template('dashboard.html', usuario=usuario_atual)


@app.route('/perfil', methods=['GET', 'POST'])
def perfil():
    if 'usuario' not in session:
        return redirect('/login')

    usuario_atual = Usuario.query.filter_by(usuario=session['usuario']).first()

    if request.method == 'POST':
        usuario_atual.recado = request.form.get('recado')
        usuario_atual.interesse = request.form.get('interesse')

        file = request.files.get('foto')
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            filename = f"user_{usuario_atual.id}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            usuario_atual.foto = filename

        db.session.commit()
        return redirect('/perfil')

    return render_template('perfil.html', usuario=usuario_atual)


# ==========================================
# FLUXO: CURSOS ➔ CONTEÚDOS
# ==========================================

@app.route('/materias')
def materias():
    if 'usuario' not in session:
        return redirect('/login')
    
    # CORREÇÃO: Buscando o usuário logado para passar ao template e alimentar a navbar
    usuario_atual = Usuario.query.filter_by(usuario=session['usuario']).first()
    
    lista_materias = list(CONTEUDO_PLATAFORMA.keys())
    return render_template('materias.html', materias=lista_materias, usuario=usuario_atual)


@app.route('/questoes/<materia>')
def conteudos(materia):
    if 'usuario' not in session:
        return redirect('/login')

    if materia not in CONTEUDO_PLATAFORMA:
        return "Matéria não encontrada.", 404

    usuario_atual = Usuario.query.filter_by(usuario=session['usuario']).first()
    topicos_da_materia = CONTEUDO_PLATAFORMA[materia]

    return render_template(
        'conteudos.html',
        materia=materia,
        topicos=topicos_da_materia,
        usuario=usuario_atual
    )


# ==========================================
# SETOR: LIVROS (Teoria Gerada Dinamicamente por IA)
# ==========================================

@app.route('/questoes/<materia>/<topico>/<nivel>/livro', methods=['GET', 'POST'])
def livro(materia, topico, nivel):
    if 'usuario' not in session:
        return redirect('/login')

    usuario_atual = Usuario.query.filter_by(usuario=session['usuario']).first()
    gosto_usuario = usuario_atual.interesse
    nivel_maximo = usuario_atual.nivel

    if nivel == 'intermediario' and nivel_maximo == 'novato':
        return redirect(f'/questoes/{materia}')
    if nivel == 'pro' and nivel_maximo in ['novato', 'intermediario']:
        return redirect(f'/questoes/{materia}')

    # Captura segura para evitar erros se a rota vier com chaves antigas
    try:
        titulo_exibicao = CONTEUDO_PLATAFORMA.get(materia, {}).get(topico, {}).get('titulo_exibicao')
        if not titulo_exibicao:
            titulo_exibicao = topico.replace("_", " ").title()
    except Exception:
        titulo_exibicao = topico.replace("_", " ").title()

    if request.method == 'POST':
        session[f"leu_{materia}_{topico}_{nivel}"] = True
        return redirect(f'/questoes/{materia}/{topico}/{nivel}/questoes')

    # ---- MODO GET: GERAR O LIVRO DIDÁTICO DO ZERO VIA GROQ ----
    chave_sessao_livro = f"texto_livro_{materia}_{topico}_{nivel}"
    
    if chave_sessao_livro not in session:
        prompt_livro = f"""Você é um professor acadêmico de elite e autor de livros de ciências exatas reconhecido mundialmente.
Sua missão é escrever um capítulo de livro teórico, curto, ultra-didático e com precisão científica absoluta sobre a disciplina '{materia}' focando especificamente no tópico '{titulo_exibicao}'.

---
[DIRETRIZES DE PÚBLICO E RIGOR]
1. Universo Visual: Explique toda a teoria aplicando analogias diretas, imersivas e maduras do universo de {gosto_usuario} (mecanismos matemáticos de RPG/jogos eletrônicos, escalas de poder de animes de batalha ou dados táticos/estatísticos esportivos reais). Evite bobeiras infantis.
2. Nível de Profundidade Teórica: {nivel.upper()}
   - Se 'novato': Presente o conceito intuitivo elementar, as regras fundamentais e a fórmula básica.
   - Se 'intermediario': Introduza propriedades conceituais/algébricas formais, manipulações estruturais e teoremas operacionais.
   - Se 'pro': Explore a fundo a teoria abstrata, teoremas avançados e demonstrações rigorosas do conceito.

---
[REGRAS DE FORMATAÇÃO E REVISÃO CRÍTICA]
- CONCEITO IMPECÁVEL: Revise internamente toda a lógica matemática ou física antes de responder. Sinais, expoentes e propriedades estruturais devem estar 100% corretos conforme as leis científicas globais.
- FORMATAÇÃO HTML: O texto gerado deve vir estruturado puramente in tags HTML simples (use exclusivamente <p>, <strong>, <ul>, <li> para parágrafos, destaques e listas).
- MATEMÁTICA EM LATEX: Toda e qualquer variável de controle, potências, expressões ou equações formais DEVEM vir encapsuladas entre cifrões simples para LaTeX inline (Ex: $2^3 = 8$, $\\log_b a = x$).
- SEJA DIRETO: Vá direto ao ponto. Entregue um texto fluido composto por 3 a 5 parágrafos densos e instrutivos. Não insira saudações, metas descritivas ou falas periféricas como "Olá aluno" ou "Espero que ajude".

Texto do Capítulo:"""

        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {
                        "role": "system", 
                        "content": "Você é um escritor de materiais educacionais em formato HTML e LaTeX científico. Você nunca erra definições ou cálculos e se limita a entregar exclusivamente o texto teórico pedido."
                    },
                    {
                        "role": "user", 
                        "content": prompt_livro
                    }
                ],
                temperature=0.2
            )
            texto_gerado = completion.choices[0].message.content.strip()
            session[chave_sessao_livro] = texto_gerado
            
        except Exception as e:
            print(f"Erro detectado na geração dinâmica do livro didático ({e}).")
            session[chave_sessao_livro] = f"<p>O motor de dados está atualizando suas matrizes teóricas. Por favor, recarregue a página para acessar o conteúdo de {titulo_exibicao}.</p>"

    return render_template(
        'livro.html',
        materia=materia,
        topico=topico,
        nivel=nivel,
        titulo_topico=titulo_exibicao,
        texto_livro=session[chave_sessao_livro],
        usuario=usuario_atual
    )


# ==========================================
# SETOR: QUESTÕES GERADAS POR IA + EXPLICAÇÃO
# ==========================================

@app.route('/questoes/<materia>/<topico>/<nivel>/questoes', methods=['GET', 'POST'])
def questoes_simulador(materia, topico, nivel):
    if 'usuario' not in session:
        return redirect('/login')

    # Validação se o usuário leu o livro teórico antes das questões
    if not session.get(f"leu_{materia}_{topico}_{nivel}"):
        return "<script>alert('Você deve ler o livro teórico antes de acessar as questões deste setor!'); window.location.href='" + f"/questoes/{materia}/{topico}/{nivel}/livro" + "';</script>"

    usuario_atual = Usuario.query.filter_by(usuario=session['usuario']).first()
    gosto_usuario = usuario_atual.interesse
    texto_do_livro = session.get(f"texto_livro_{materia}_{topico}_{nivel}", "")
    
    try:
        titulo_exibicao = CONTEUDO_PLATAFORMA[materia][topico]['titulo_exibicao']
    except KeyError:
        titulo_exibicao = topico.replace("_", " ").title()

    resultado = None
    pontos_ganhos = 0
    explicacao_ia = None

    # ---- MODO POST: CORRIGIR RESPOSTA E PEDIR EXPLICAÇÃO À IA ----
    if request.method == 'POST':
        pergunta = session.get('questao_atual')
        resposta_usuario = request.form.get('resposta')

        if pergunta and resposta_usuario:
            if 'correta' not in pergunta:
                pergunta['correta'] = 'a'
            
            # Validação da resposta
            if resposta_usuario.lower() == pergunta['correta'].lower():
                resultado = 'Acertou!'
                usuario_atual.pontos += 10
                pontos_ganhos = 10
            else:
                resultado = 'Errou!'

            # Salva histórico no Banco de Dados de forma garantida
            novo_historico = Historico(
                usuario=session['usuario'],
                pergunta=pergunta['titulo'],
                resultado=resultado
            )
            db.session.add(novo_historico)
            db.session.commit()

            # Prompt focado em explicar o resultado da questão já respondida
            prompt_explicacao = f"""Você é um tutor pedagógico experiente. O aluno acabou de responder uma questão de {materia} focada em {titulo_exibicao}.
            
Enunciado da Questão: {pergunta['titulo']}
Alternativa Correta: {pergunta['correta'].upper()}) {pergunta.get(pergunta['correta'].lower(), '')}
Resposta Escolhida pelo Aluno: {resposta_usuario.upper()} (O aluno {resultado})

Forneça uma explicação curta, direta, cientificamente correta e pedagógica (máximo de 4 linhas) justificando o porquê de a alternativa {pergunta['correta'].upper()} ser a resposta certa. Use referências de {gosto_usuario} de forma natural para engajar e aplique LaTeX nas fórmulas matemáticas se houver."""

            try:
                resposta_explicacao = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt_explicacao}],
                    temperature=0.4
                )
                explicacao_ia = resposta_explicacao.choices[0].message.content
            except Exception as e:
                print(f"Erro na geração da explicação: {e}")
                explicacao_ia = "Não foi possível carregar a explicação em tempo real, mas revise os conceitos descritos no livro do módulo!"
            
            # Retorna o mesmo template mantendo a pergunta atual fixa para mostrar a correção
            return render_template(
                'questoes_sistema.html',
                pergunta=pergunta,
                resultado=resultado,
                materia=materia,
                topico=topico,
                nivel=nivel,
                usuario=usuario_atual,
                pontos_ganhos=pontos_ganhos,
                explicacao_ia=explicacao_ia
            )

    # ---- MODO GET: GERAR NOVA QUESTÃO DINÂMICA VIA GROQ ----
    prompt_geracao = f"""Você é um criador de avaliações acadêmicas. Sua tarefa é criar uma questão de múltipla escolha baseada estritamente na disciplina de '{materia}' e no conteúdo didático fornecido abaixo. Não invente conteúdos de outras matérias.

---
[DIRETRIZES DA MATÉRIA E DO ALUNO]
- Disciplina Obrigatória: {materia} (Tópico específico: {titulo_exibicao})
- Perfil do aluno (Contexto visual): {gosto_usuario} (Utilize termos desse universo para envelopar o enunciado de forma imersiva e madura).
- Nível de complexidade: {nivel}

---
[TEXTO DE REFERÊNCIA DO LIVRO - UTILIZE ISTO COMO BASE]
"{texto_do_livro}"

---
[FORMATO DE SAÍDA EXIGIDO]
Sua resposta deve ser estritamente um objeto JSON puro e válido, sem markdown (sem ```json), respeitando as chaves abaixo:

{{
    "titulo": "Enunciado completo da questão focado em {materia} e estruturado no universo de {gosto_usuario}. Use LaTeX entre $ se contiver formulações matemáticas.",
    "a": "Texto da alternativa A",
    "b": "Texto da alternativa B",
    "c": "Texto da alternativa C",
    "d": "Texto da alternativa D",
    "correta": "Letra minúscula da alternativa correta (a, b, c ou d)"
}}"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system", 
                    "content": f"Você é um gerador de questões focado exclusivamente na matéria de {materia}. Você nunca gera conteúdos de matemática a menos que a matéria solicitada seja matemática."
                },
                {
                    "role": "user", 
                    "content": prompt_geracao
                }
            ],
            temperature=0.4,
            response_format={"type": "json_object"}
        )
        
        texto_limpo = completion.choices[0].message.content.strip()
        pergunta = json.loads(texto_limpo)
        pergunta['correta'] = pergunta['correta'].lower()
        session['questao_atual'] = pergunta
        session.modified = True  # Garante persistência imediata no cookie de sessão
        
    except Exception as e:
        print(f"Erro na API Groq ao gerar questão: {e}")
        pergunta = {
            'titulo': f'Considerando as propriedades fundamentais de {titulo_exibicao} na disciplina de {materia}, qual alternativa apresenta a correlação correta do módulo?',
            'a': 'A alternativa mapeia os conceitos estruturais de forma linear.',
            'b': 'Apresenta a aplicação direta descrita no capítulo teórico do livro.',
            'c': 'Configura uma análise isolada das variáveis de controle.',
            'd': 'Inverte os conceitos básicos determinados pelas leis da área.',
            'correta': 'b'
        }
        session['questao_atual'] = pergunta
        session.modified = True

    return render_template(
        'questoes_sistema.html',
        pergunta=pergunta,
        resultado=resultado,
        materia=materia,
        topico=topico,
        nivel=nivel,
        usuario=usuario_atual,
        pontos_ganhos=pontos_ganhos,
        explicacao_ia=explicacao_ia
    )


# ==========================================
# ROTA DO HISTÓRICO DE ESTUDOS
# ==========================================

@app.route('/historico')
def historico():
    if 'usuario' not in session:
        return redirect('/login')

    # CORREÇÃO: Carregando o usuário para que a navbar de historico.html não quebre
    usuario_atual = Usuario.query.filter_by(usuario=session['usuario']).first()

    # Busca apenas os históricos do usuário logado
    historicos_usuario = Historico.query.filter_by(usuario=session['usuario']).all()

    # Renderiza o template mandando os dados obtidos do banco
    return render_template('historico.html', historicos=historicos_usuario, usuario=usuario_atual)


# ==========================================
# INICIALIZAÇÃO DO SERVIDOR
# ==========================================

if __name__ == '__main__':
    app.run(debug=True)