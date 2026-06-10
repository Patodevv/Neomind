import os
import random
import json 
from flask import Flask, render_template, request, redirect, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from groq import Groq

from conteudos_dados import CONTEUDO_PLATAFORMA

app = Flask(__name__)

# Configurações do App
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'mvp_edtech'

UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Limita o upload a 16MB

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

db = SQLAlchemy(app)
groq_client = Groq(api_key="")

# ==========================================
# MODELOS DO BANCO DE DADOS
# ==========================================

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(100), unique=True, nullable=False)
    senha = db.Column(db.String(100), nullable=False)

    interesse = db.Column(db.String(50), nullable=False)
    recado = db.Column(db.String(300), nullable=True, default="Olá! Estou focado nos meus estudos.")
    foto = db.Column(db.String(200), nullable=True, default="default.png")
    pontos = db.Column(db.Integer, nullable=False, default=0)

    @property
    def nivel(self):
        if self.pontos < 50:
            return 'novato'
        elif self.pontos < 100:
            return 'intermediario'
        else:
            return 'pro'

class Historico(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(100), nullable=False)
    pergunta = db.Column(db.String(200), nullable=False)
    resultado = db.Column(db.String(50), nullable=False)

# Inicialização do Banco
with app.app_context():
    db.create_all()

# ==========================================
# ROTAS DO SISTEMA
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
    session.clear() 
    return redirect('/login')


@app.route('/dashboard')
def dashboard():
    if 'usuario' not in session:
        return redirect('/login')
    usuario_atual = Usuario.query.filter_by(usuario=session['usuario']).first()
    # Passa o nome como string simples, pois o template dashboard.html
    # referencia {{ usuario }} diretamente para exibir o nome do jogador.
    return render_template('dashboard.html', usuario=usuario_atual.usuario)


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


@app.route('/materias')
def materias():
    if 'usuario' not in session:
        return redirect('/login')
    
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

    try:
        titulo_exibicao = CONTEUDO_PLATAFORMA.get(materia, {}).get(topico, {}).get('titulo_exibicao')
        if not titulo_exibicao:
            titulo_exibicao = topico.replace("_", " ").title()
    except Exception:
        titulo_exibicao = topico.replace("_", " ").title()

    if request.method == 'POST':
        session[f"leu_{materia}_{topico}_{nivel}"] = True
        return redirect(f'/questoes/{materia}/{topico}/{nivel}/questoes')

    chave_sessao_livro = f"texto_livro_{materia}_{topico}_{nivel}"
    
    if chave_sessao_livro not in session:

        NIVEIS_DESCRICAO = {
            'novato':       'introdutório — conceitos fundamentais, sem pré-requisitos, linguagem acessível',
            'intermediario':'intermediário — aprofunda relações entre conceitos, inclui fórmulas e aplicações práticas',
            'pro':          'avançado — análise crítica, demonstrações, casos-limite e nuances teóricas complexas'
        }
        descricao_nivel = NIVEIS_DESCRICAO.get(nivel, nivel)

        UNIVERSOS = {
            'animes':   'animes e mangás (personagens, batalhas, poderes, academias ninja/magia, torneios)',
            'jogos':    'videogames (RPGs, FPS, estratégia, mecânicas de jogo, missões, stats de personagem)',
            'esportes': 'esportes (táticas de jogo, treinamentos, competições, estatísticas de atletas)'
        }
        contexto_interesse = UNIVERSOS.get(gosto_usuario, gosto_usuario)

        prompt_livro = f"""Você é um autor de materiais didáticos de elite. Sua missão é escrever um capítulo teórico sobre "{titulo_exibicao}" da disciplina "{materia}".

## PERFIL DO LEITOR
- Nível de conhecimento: {descricao_nivel}
- Universo de interesse para analogias: {contexto_interesse}

## INSTRUÇÕES DE CONTEÚDO
1. Cubra os conceitos centrais do tópico com precisão técnica rigorosa, adequada ao nível exigido.
2. Para cada conceito abstrato, construa UMA analogia clara usando o universo "{gosto_usuario}" — a analogia deve iluminar o conceito, não substituí-lo.
3. Inclua pelo menos uma fórmula ou expressão técnica relevante ao tópico (use LaTeX inline: $formula$).
4. Mantenha neutralidade absoluta: sem opiniões políticas, morais ou ideológicas.
5. Extensão: entre 4 e 6 parágrafos densos e informativos.

## FORMATO DE SAÍDA
- Retorne SOMENTE HTML usando as tags: <p>, <strong>, <ul>, <li>.
- Fórmulas: LaTeX inline entre cifrões simples — ex: $F = ma$.
- Sem títulos, saudações, introduções meta ou conclusões do tipo "espero ter ajudado".
- Comece diretamente com o primeiro <p> do conteúdo.

Capítulo:"""

        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Você é um redator acadêmico especialista. "
                            "Produz HTML didático estruturado com LaTeX inline para fórmulas. "
                            "Nunca quebra o formato solicitado. Nunca emite julgamentos de valor."
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt_livro
                    }
                ],
                temperature=0.25
            )
            texto_gerado = completion.choices[0].message.content.strip()
            session[chave_sessao_livro] = texto_gerado
            
        except Exception as e:
            print(f"Erro na geração do livro didático: {e}")
            session[chave_sessao_livro] = (
                f"<p>O módulo de geração de conteúdo está atualizando suas matrizes. "
                f"Recarregue a página para acessar o capítulo de <strong>{titulo_exibicao}</strong>.</p>"
            )

    return render_template(
        'livro.html',
        materia=materia,
        topico=topico,
        nivel=nivel,
        titulo_topico=titulo_exibicao,
        texto_livro=session[chave_sessao_livro],
        usuario=usuario_atual
    )


@app.route('/questoes/<materia>/<topico>/<nivel>/questoes', methods=['GET', 'POST'])
def questoes_simulador(materia, topico, nivel):
    if 'usuario' not in session:
        return redirect('/login')
    if not session.get(f"leu_{materia}_{topico}_{nivel}"):
        return (
            "<script>"
            "alert('Você deve ler o livro teórico antes de acessar as questões deste setor!');"
            f"window.location.href='/questoes/{materia}/{topico}/{nivel}/livro';"
            "</script>"
        )

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

    if request.method == 'POST':
        pergunta = session.get('questao_atual')
        resposta_usuario = request.form.get('resposta')

        if pergunta and resposta_usuario:
            if 'correta' not in pergunta:
                pergunta['correta'] = 'a'
            if resposta_usuario.lower() == pergunta['correta'].lower():
                resultado = 'Acertou!'
                usuario_atual.pontos += 10
                pontos_ganhos = 10
            else:
                resultado = 'Errou!'

            novo_historico = Historico(
                usuario=session['usuario'],
                pergunta=pergunta['titulo'],
                resultado=resultado
            )
            db.session.add(novo_historico)
            db.session.commit()

            gabarito_letra = pergunta['correta'].upper()
            gabarito_texto = pergunta.get(pergunta['correta'].lower(), '(sem texto)')
            acertou = resultado == 'Acertou!'

            prompt_explicacao = f"""Você é um tutor acadêmico direto e envolvente. Gere um feedback pedagógico sobre a questão abaixo.

## DADOS DA QUESTÃO
- Disciplina / Tópico: {materia} — {titulo_exibicao}
- Enunciado: {pergunta['titulo']}
- Gabarito correto: {gabarito_letra}) {gabarito_texto}
- O aluno respondeu: {"CORRETAMENTE ✓" if acertou else f"INCORRETAMENTE ✗ (escolheu a alternativa {resposta_usuario.upper()})"}

## INSTRUÇÕES
1. {'Parabenize brevemente e reforce POR QUÊ a alternativa está correta, citando o princípio científico/técnico central.' if acertou else 'Seja empático mas direto: explique onde o raciocínio falha e POR QUÊ o gabarito é correto, mostrando o princípio científico/técnico envolvido.'}
2. Use UMA referência curta e espirituosa do universo "{gosto_usuario}" para tornar a explicação memorável — mas não deixe a analogia dominar o raciocínio técnico.
3. Se houver fórmula relevante, use LaTeX inline: $formula$.
4. Seja conciso: máximo 4 linhas. Sem introduções do tipo "Claro!" ou "Ótima pergunta!".

Feedback:"""

            try:
                resposta_explicacao = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "Você é um tutor acadêmico preciso e motivador. "
                                "Seus feedbacks são técnicos, concisos e levemente divertidos. "
                                "Nunca emite julgamentos morais ou políticos."
                            )
                        },
                        {
                            "role": "user",
                            "content": prompt_explicacao
                        }
                    ],
                    temperature=0.3
                )
                explicacao_ia = resposta_explicacao.choices[0].message.content.strip()
            except Exception as e:
                print(f"Erro na geração da explicação: {e}")
                explicacao_ia = "Não foi possível carregar a explicação em tempo real. Revise os conceitos no livro do módulo!"
            
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

    # ── GERAÇÃO DA QUESTÃO ──
    NIVEIS_INSTRUCAO = {
        'novato':       'básico: conceitos diretos, sem cálculos complexos, alternativas claramente distintas',
        'intermediario':'intermediário: exige relacionar conceitos e aplicar fórmulas simples',
        'pro':          'avançado: análise crítica, casos-limite, cálculos mais elaborados, distratores sutis'
    }
    instrucao_nivel = NIVEIS_INSTRUCAO.get(nivel, nivel)

    prompt_geracao = f"""Você é um elaborador de questões acadêmicas de alto nível. Crie uma questão de múltipla escolha original sobre "{titulo_exibicao}" em "{materia}".

## PARÂMETROS
- Nível de dificuldade: {instrucao_nivel}
- Universo temático para o cenário: {gosto_usuario}
- Neutralidade: sem viés ideológico, moral ou político

## DIRETRIZES DE QUALIDADE
1. O ENUNCIADO deve apresentar um problema ou situação real ambientado criativamente em "{gosto_usuario}", exigindo aplicação do conteúdo de {titulo_exibicao}.
2. As ALTERNATIVAS devem ser plausíveis e bem redigidas — evite distratores obviamente absurdos.
3. Apenas UMA alternativa deve ser inquestionavelmente correta com base na teoria de {materia}.
4. Use LaTeX inline ($...$) para qualquer expressão matemática ou científica no enunciado e nas alternativas.
5. Baseie-se estritamente no conteúdo do texto de referência abaixo.

## TEXTO DE REFERÊNCIA
{texto_do_livro}

## FORMATO DE SAÍDA — JSON PURO (sem markdown, sem blocos de código)
{{
    "titulo": "Enunciado da questão com cenário de {gosto_usuario} cobrando {titulo_exibicao}.",
    "a": "Texto completo da alternativa A.",
    "b": "Texto completo da alternativa B.",
    "c": "Texto completo da alternativa C.",
    "d": "Texto completo da alternativa D.",
    "correta": "letra minúscula da alternativa correta (a, b, c ou d)"
}}"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Você é um elaborador de avaliações acadêmicas. "
                        "Retorna EXCLUSIVAMENTE JSON válido conforme o schema solicitado. "
                        "Nunca adiciona texto fora do JSON. Nunca usa blocos de código markdown."
                    )
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
        session.modified = True
        
    except Exception as e:
        print(f"Erro na API Groq ao gerar questão: {e}")
        pergunta = {
            'titulo': f'Considerando os princípios fundamentais de {titulo_exibicao} na disciplina de {materia}, qual alternativa apresenta a correlação correta?',
            'a': 'Aplica corretamente os conceitos estruturais descritos no módulo teórico.',
            'b': 'Inverte a relação de causa e efeito prevista pela teoria.',
            'c': 'Confunde variáveis dependentes com parâmetros de controle.',
            'd': 'Generaliza indevidamente um caso particular para o modelo geral.',
            'correta': 'a'
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


@app.route('/historico')
def historico():
    if 'usuario' not in session:
        return redirect('/login')

    usuario_atual = Usuario.query.filter_by(usuario=session['usuario']).first()
    historicos_usuario = Historico.query.filter_by(usuario=session['usuario']).all()

    return render_template('historico.html', historicos=historicos_usuario, usuario=usuario_atual)


if __name__ == '__main__':
    app.run(debug=True)