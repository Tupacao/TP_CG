# 🎨 Sistema Gráfico Acadêmico (Canvas 800×600)

🔗 **Acesse o projeto:**  
https://tupacao.github.io/TP_CG/

---

Projeto de **Computação Gráfica** desenvolvido em **HTML, CSS e JavaScript puro**, com rasterização **pixel a pixel** utilizando `fillRect(1×1)` — sem uso de `lineTo`, `arc` ou frameworks.

O sistema foi estruturado com **módulos ES (import/export)**, seguindo boas práticas de organização, separação de responsabilidades e código limpo.

---

## 📚 Conteúdo Didático Implementado

| Tópico | Descrição |
|------|----------|
| **DDA** | Reta por incremento fracionário (`src/algorithms/dda.js`) |
| **Bresenham (reta)** | Algoritmo inteiro para todos os octantes (`src/algorithms/bresenham.js`) |
| **Circunferência** | Bresenham com simetria em 8 octantes (`src/algorithms/circle.js`) |
| **Bézier Cúbica** | Curva paramétrica com 4 pontos de controle (`src/algorithms/bezier.js`) |
| **Hermite Cúbica** | Curva paramétrica interpolada com tangentes (`src/algorithms/hermite.js`) |
| **Transformações** | Translação, rotação, escala e reflexões (centro do canvas) |
| **Recorte de linhas** | Cohen–Sutherland e Liang–Barsky |
| **Seleção** | Retângulo com interseção AABB |
| **Feedback visual** | Marcação temporária de cliques |

---

## 🗂️ Estrutura do Projeto
CG/
├── index.html
├── style.css
├── main.js
└── src/
├── core/
│ ├── canvas.js
│ ├── state.js
│ └── render.js
├── algorithms/
│ ├── dda.js
│ ├── bresenham.js
│ ├── circle.js
│ └── clipping/
│ ├── cohenSutherland.js
│ └── liangBarsky.js
├── transformations/
│ ├── translate.js
│ ├── rotate.js
│ ├── scale.js
│ └── reflect.js
├── utils/
│ ├── math.js
│ ├── geometry.js
│ └── helpers.js
├── interaction/
│ ├── mouse.js
│ └── selection.js
├── ui/
│ ├── controls.js
│ └── hud.js
└── feedback/
└── clickFeedback.js


---

## 🧠 Organização por Responsabilidade

### 🔹 core/
- Gerenciamento do canvas  
- Estado global da aplicação  
- Pipeline de renderização  

### 🔹 algorithms/
- Algoritmos gráficos puros  
- Não acessam estado nem DOM  
- Recebem função `plot(x, y, cor)`  

### 🔹 transformations/
- Manipulação geométrica dos objetos  
- Operam sobre dados recebidos  

### 🔹 utils/
- Funções matemáticas e geométricas reutilizáveis  

### 🔹 interaction/
- Eventos de mouse  
- Entrada do usuário (sem render direto)  

### 🔹 ui/
- Controles e interface  
- HUD informativo  

### 🔹 feedback/
- Sistema visual de clique com decaimento  

---

## 🎯 Curvas Paramétricas Cúbicas

### 🔸 Curva de Bézier Cúbica

**Descrição:**  
Uma curva suave que passa pelos pontos inicial (P0) e final (P3), sendo atraída pelos pontos de controle intermediários (P1 e P2). Muito utilizada em design gráfico e animação.

**Equação:**  
$$B(t) = (1-t)^3 \cdot P_0 + 3(1-t)^2 \cdot t \cdot P_1 + 3(1-t) \cdot t^2 \cdot P_2 + t^3 \cdot P_3$$

para $t \in [0, 1]$.

**Pontos de Controle:**
- **P0**: Ponto inicial (pelo qual a curva passa)
- **P1**: Primeiro ponto de controle (influencia a saída de P0)
- **P2**: Segundo ponto de controle (influencia a entrada em P3)
- **P3**: Ponto final (pelo qual a curva passa)

**Como Usar (Interface):**
1. Clique em "Bézier Cúbica"
2. Clique 4 vezes no canvas para definir P0, P1, P2, P3
3. A curva será desenhada entre os cliques (visualização em tempo real)
4. Selecione a curva para visualizar o polígono de controle

**Implementação:**
- Arquivo: `src/algorithms/bezier.js`
- Função principal: `drawBezierCurve(plot, x0, y0, x1, y1, x2, y2, x3, y3, color, samples)`
- Função de avaliação: `evaluateBezier(P0, P1, P2, P3, t)`
- Função de visualização: `drawBezierControlHull(...)`

---

### 🔸 Curva de Hermite Cúbica

**Descrição:**  
Uma curva que interpola dois pontos (P0 e P1) utilizando vetores tangentes (T0 e T1) para controlar a direção e velocidade da curva. Muito usada em interpolação de caminho e animação de câmera.

**Equações Base (Polinômios de Hermite):**  
$$h_1(t) = 2t^3 - 3t^2 + 1$$
$$h_2(t) = -2t^3 + 3t^2$$
$$h_3(t) = t^3 - 2t^2 + t$$
$$h_4(t) = t^3 - t^2$$

**Equação Interpolada:**  
$$H(t) = h_1(t) \cdot P_0 + h_2(t) \cdot P_1 + h_3(t) \cdot T_0 + h_4(t) \cdot T_1$$

para $t \in [0, 1]$.

**Parâmetros:**
- **P0**: Ponto inicial (interpolado em t=0)
- **P1**: Ponto final (interpolado em t=1)
- **T0**: Vetor tangente inicial (derivada em P0)
- **T1**: Vetor tangente final (derivada em P1)

**Como Usar (Interface):**
1. Clique em "Hermite Cúbica"
2. Clique 4 vezes:
   - 1º clique: Ponto inicial P0
   - 2º clique: Ponto final P1
   - 3º clique: Extremidade da tangente T0 (saída de P0)
   - 4º clique: Extremidade da tangente T1 (entrada em P1)
3. A curva será desenhada entre os cliques (visualização em tempo real)
4. Selecione a curva para visualizar as tangentes e pontos de controle

**Implementação:**
- Arquivo: `src/algorithms/hermite.js`
- Função principal: `drawHermiteCurve(plot, x0, y0, x1, y1, tx0, ty0, tx1, ty1, color, samples)`
- Função de avaliação: `evaluateHermite(P0, P1, T0, T1, t)`
- Função de visualização: `drawHermiteControlHull(...)`

---

## ▶️ Como Executar

### ✔️ Online (mais fácil)
Acesse diretamente:  
https://tupacao.github.io/TP_CG/

---

### ✔️ Local (desenvolvimento)

#### Usando Live Server
- Abra no VS Code / Cursor  
- Clique em **“Go Live”**

## 🎮 Funcionalidades

### 🧰 Ferramentas
- Seleção  
- DDA  
- Bresenham (reta)  
- Circunferência  
- **Bézier Cúbica** ✨ (NOVO)
- **Hermite Cúbica** ✨ (NOVO)
- Recorte (CS / LB)  
- Limpar tela  

### 🖱️ Interação
- Dois cliques → criação de primitivas  
- Arrastar → seleção retangular  
- Circunferência → centro + raio  
- **Bézier Cúbica → 4 cliques para pontos de controle (P0, P1, P2, P3)** ✨
- **Hermite Cúbica → 4 cliques para pontos + tangentes (P0, P1, T0, T1)** ✨

### 🔄 Transformações
- Translação  
- Rotação  
- Escala  
- Reflexões (X, Y, XY — centro do canvas)  

### 🖥️ HUD
- Modo atual  
- Coordenadas do mouse  
- Contagem de objetos e seleção  

---

## 🏗️ Decisões de Arquitetura

### ✔️ Injeção de `plot`
- Algoritmos recebem função de desenho  
- Independência total do canvas  

### ✔️ Render centralizado
- Apenas `render.js` desenha  
- Pipeline previsível e organizado  

### ✔️ Estado isolado
- `state.js` controla toda a aplicação  
- Evita efeitos colaterais inesperados  

### ✔️ Baixo acoplamento
- `mouse.js` não importa `render.js`  
- Comunicação via `requestRender`  

---

## � Exemplos de Uso das Curvas Paramétricas

### Exemplo 1: Criar uma Curva de Bézier em S

1. Clique em **"Bézier Cúbica"**
2. Clique nos seguintes pontos:
   - **P0**: (100, 300) — início inferior-esquerdo
   - **P1**: (150, 100) — puxa para cima
   - **P2**: (350, 500) — puxa para baixo
   - **P3**: (400, 300) — fim inferior-direito
3. Resultado: Uma curva suave em formato de "S"

### Exemplo 2: Criar uma Curva de Hermite com Tangentes Simétricas

1. Clique em **"Hermite Cúbica"**
2. Clique nos seguintes pontos:
   - **P0**: (200, 150) — ponto inicial (alto-esquerda)
   - **P1**: (600, 150) — ponto final (alto-direita)
   - **T0 extremo**: (250, 50) — tangente apontando para cima-direita
   - **T1 extremo**: (550, 50) — tangente apontando para cima-esquerda
3. Resultado: Uma "montanha" com pico no meio

### Exemplo 3: Comparar Curvas no Mesmo Canvas

1. Desenhe uma Bézier
2. Desenhe uma Hermite com os mesmos pontos de início/fim
3. Observe as diferenças:
   - Bézier segue mais o polígono de controle
   - Hermite passa exatamente pelos pontos de interpolação com controle de tangente

---
## 🗂️ Estrutura de Dados das Curvas

### Objeto Bézier Cúbica (no estado)
```javascript
{
  id: number,
  type: 'bezier',
  x0: number,  // P0.x — ponto inicial
  y0: number,  // P0.y
  x1: number,  // P1.x — 1º ponto de controle
  y1: number,  // P1.y
  x2: number,  // P2.x — 2º ponto de controle
  y2: number,  // P2.y
  x3: number,  // P3.x — ponto final
  y3: number   // P3.y
}
```

### Objeto Hermite Cúbica (no estado)
```javascript
{
  id: number,
  type: 'hermite',
  x0: number,   // P0.x — ponto inicial
  y0: number,   // P0.y
  x1: number,   // P1.x — ponto final
  y1: number,   // P1.y
  tx0: number,  // T0.x — tangente inicial (vetor)
  ty0: number,  // T0.y
  tx1: number,  // T1.x — tangente final (vetor)
  ty1: number   // T1.y
}
```

### Fluxo de Criação de Curva Bézier

1. Usuário clica botão "Bézier Cúbica"
   - `mode` muda para `'bezier'`
   - `pendingPoints = []`
   
2. Usuário clica no canvas 4 vezes
   - Cada clique adiciona ponto a `pendingPoints`
   - `render()` mostra preview dos pontos e linhas
   - Flash visual em cada clique

3. Após 4º clique
   - `addBezierToState()` cria objeto no array `objects`
   - `pendingPoints` é zerado
   - `render()` desenha a curva via `drawBezierCurve()`

4. Usuário seleciona a curva
   - `bboxBezier()` calcula seleção
   - `drawBezierControlHull()` mostra polígono de controle
   - Cor muda para cyan (`selectedFg`)

### Fluxo de Criação de Curva Hermite

1. Usuário clica botão "Hermite Cúbica"
   - `mode` muda para `'hermite'`
   - `pendingPoints = []`
   
2. Usuário clica 4 vezes (com feedback detalhado)
   - 1º clique: P0 (ponto inicial)
   - 2º clique: P1 (ponto final)
   - 3º clique: Extremo de T0 (tangente em P0)
   - 4º clique: Extremo de T1 (tangente em P1)
   - Cada clique mostra preview
   - Tangentes calculadas como: `T0 = p[2] - p[0]`, `T1 = p[3] - p[1]`

3. Após 4º clique
   - `addHermiteToState()` cria objeto no array `objects`
   - `pendingPoints` é zerado
   - `render()` desenha a curva via `drawHermiteCurve()`

4. Usuário seleciona a curva
   - `bboxHermite()` calcula seleção
   - `drawHermiteControlHull()` mostra tangentes escaladas
   - Cor muda para amber (`selectedHull`)

---
## �🚀 Melhorias Futuras

- Suporte a **polígonos**  
- Implementação de **zoom e pan**  
- Exibição de **grid**  
- Sistema de **undo/redo**  
- Testes automatizados  
- Exportação/importação de cena  

---

## 📌 Requisitos

- Navegador moderno  
- Suporte a ES Modules  
- Servidor HTTP local  

---

## 📄 Licença

Projeto para fins acadêmicos.  
Sinta-se livre para adaptar e utilizar conforme as diretrizes da sua instituição.
