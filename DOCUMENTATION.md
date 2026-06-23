# Documentação: Curvas Paramétricas Cúbicas
## Implementação de Bézier e Hermite em Canvas HTML5

---

## 📑 Sumário
1. [Introdução](#introdução)
2. [Fundamentação Matemática](#fundamentação-matemática)
3. [Organização do Código](#organização-do-código)
4. [Arquitetura e Design](#arquitetura-e-design)
5. [Estrutura de Dados](#estrutura-de-dados)
6. [Manual de Uso](#manual-de-uso)
7. [Exemplos de Uso](#exemplos-de-uso)
8. [Decisões de Implementação](#decisões-de-implementação)

---

## Introdução

Este projeto implementa duas curvas paramétricas cúbicas em um sistema gráfico educacional baseado em Canvas HTML5 com rasterização pixel a pixel:

### Curvas Implementadas

1. **Curva de Bézier Cúbica** - Utiliza 4 pontos de controle
2. **Curva de Hermite Cúbica** - Utiliza 2 pontos de interpolação + 2 tangentes

Ambas as curvas são parametrizadas no intervalo **t ∈ [0, 1]** e são amostradas para gerar aproximações poligonais rasterizáveis.

### Contexto do Projeto

- **Plataforma**: Canvas HTML5 (800×600 pixels)
- **Linguagem**: JavaScript ES6 (módulos)
- **Paradigma**: Funcional com injeção de dependência
- **Sem bibliotecas externas**: Apenas JavaScript puro

---

## Fundamentação Matemática

### 1. Curva de Bézier Cúbica

#### 1.1 Definição

Uma curva de Bézier cúbica é uma curva polinomial paramétrica de terceiro grau que passa pelo ponto inicial (P₀) e final (P₃), sendo atraída pelos pontos de controle intermediários (P₁ e P₂).

#### 1.2 Equação Paramétrica

A posição de um ponto na curva para um parâmetro t ∈ [0, 1] é definida pela combinação linear dos quatro pontos de controle ponderados pelos polinômios de Bernstein de grau 3:

$$B(t) = (1-t)^3 \cdot P_0 + 3(1-t)^2 \cdot t \cdot P_1 + 3(1-t) \cdot t^2 \cdot P_2 + t^3 \cdot P_3$$

#### 1.3 Polinômios de Bernstein (Grau 3)

Os coeficientes da combinação linear são os polinômios de Bernstein:

$$b_{0,3}(t) = (1-t)^3$$

$$b_{1,3}(t) = 3(1-t)^2 \cdot t$$

$$b_{2,3}(t) = 3(1-t) \cdot t^2$$

$$b_{3,3}(t) = t^3$$

**Propriedades:**
- Soma dos coeficientes = 1 para todo t
- Não-negatividade em [0, 1]
- Máximo em posições regulares no intervalo

#### 1.4 Pontos de Controle

| Ponto | Nome | Função | Propriedade |
|-------|------|--------|-------------|
| P₀ | Ponto inicial | Ponto inicial da curva | A curva passa por P₀ quando t=0 |
| P₁ | 1º ponto de controle | Puxa a curva em sua direção | Influencia direção de saída de P₀ |
| P₂ | 2º ponto de controle | Puxa a curva em sua direção | Influencia direção de entrada a P₃ |
| P₃ | Ponto final | Ponto final da curva | A curva passa por P₃ quando t=1 |

#### 1.5 Propriedades da Curva Bézier

1. **Continuidade C⁰**: A curva passa pelos pontos inicial e final
2. **Convex Hull Property**: A curva fica sempre dentro do polígono formado pelos 4 pontos de controle
3. **Simetria**: A curva é simétrica: B(t) descrita por P₀,P₁,P₂,P₃ é o reverso de B(1-t) descrita por P₃,P₂,P₁,P₀
4. **Invariância Afim**: Transformações afins dos pontos de controle resultam em transformações afins da curva

#### 1.6 Derivada da Curva Bézier

A tangente em qualquer ponto t é:

$$\frac{dB}{dt}(t) = 3(1-t)^2(P_1 - P_0) + 6(1-t)t(P_2 - P_1) + 3t^2(P_3 - P_2)$$

Em t=0: Tangente inicial aponta de P₀ para P₁  
Em t=1: Tangente final aponta de P₂ para P₃

---

### 2. Curva de Hermite Cúbica

#### 2.1 Definição

A curva de Hermite é uma curva que **interpola exatamente dois pontos** e usa **vetores tangentes** para controlar a forma da curva nesses pontos. É definida por:
- **P₀**: ponto inicial
- **P₁**: ponto final
- **T₀**: tangente (derivada) no ponto inicial
- **T₁**: tangente (derivada) no ponto final

#### 2.2 Funções Base de Hermite

Os polinômios de Hermite de grau 3 são definidos como:

$$h_1(t) = 2t^3 - 3t^2 + 1$$

$$h_2(t) = -2t^3 + 3t^2$$

$$h_3(t) = t^3 - 2t^2 + t$$

$$h_4(t) = t^3 - t^2$$

#### 2.3 Propriedades das Funções Base

**Para h₁(t) e h₂(t)** (interpolação de posição):
- h₁(0) = 1, h₁(1) = 0 → seleciona P₀
- h₂(0) = 0, h₂(1) = 1 → seleciona P₁
- Ambas variam suavemente de 0 a 1 ou vice-versa

**Para h₃(t) e h₄(t)** (influência de tangente):
- h₃(0) = 0, h₃(1) = 0 → tangente não afeta endpoints
- h₄(0) = 0, h₄(1) = 0 → tangente não afeta endpoints
- Influenciam a curvatura sem alterar os pontos interpolados

#### 2.4 Equação Interpolada

A curva de Hermite é definida por:

$$H(t) = h_1(t) \cdot P_0 + h_2(t) \cdot P_1 + h_3(t) \cdot T_0 + h_4(t) \cdot T_1$$

onde t ∈ [0, 1].

#### 2.5 Verificação da Interpolação

- **H(0)** = 1·P₀ + 0·P₁ + 0·T₀ + 0·T₁ = **P₀** ✓
- **H(1)** = 0·P₀ + 1·P₁ + 0·T₀ + 0·T₁ = **P₁** ✓
- **H'(0)** = derivada em t=0 = **T₀** ✓
- **H'(1)** = derivada em t=1 = **T₁** ✓

#### 2.6 Derivada da Curva Hermite

$$\frac{dH}{dt}(t) = h_1'(t) \cdot P_0 + h_2'(t) \cdot P_1 + h_3'(t) \cdot T_0 + h_4'(t) \cdot T_1$$

onde:
- h₁'(t) = 6t² - 6t
- h₂'(t) = -6t² + 6t
- h₃'(t) = 3t² - 4t + 1
- h₄'(t) = 3t² - 2t

#### 2.7 Comparação com Bézier

| Aspecto | Bézier | Hermite |
|---------|--------|---------|
| Passes por P₀ e P₃ | Sim | Sim (P₀ e P₁) |
| Controle de tangente | Indireto (via P₁, P₂) | Direto (T₀, T₁) |
| Passes por intermediários | Não | Não |
| Caso de uso | Design, suavização | Interpolação, animação |
| Continuidade | C⁰ natural | C⁰ natural, C¹ se tangentes alinhadas |

---

## Organização do Código

### Estrutura de Diretórios

```
src/
├── algorithms/
│   ├── bezier.js          ← Implementação Bézier
│   ├── hermite.js         ← Implementação Hermite
│   ├── bresenham.js       ← Algoritmo de reta (existente)
│   └── dda.js             ← Algoritmo DDA (existente)
├── core/
│   ├── state.js           ← Gerenciamento de estado (modificado)
│   ├── render.js          ← Pipeline de renderização (modificado)
│   └── canvas.js          ← Inicialização canvas (existente)
├── interaction/
│   └── mouse.js           ← Eventos de mouse (modificado)
└── utils/
    └── geometry.js        ← Cálculos geométricos (modificado)
```

### Arquivos Modificados

#### 1. **src/algorithms/bezier.js** (NOVO)

**Funções principais:**
- `evaluateBezier(P0, P1, P2, P3, t)` - Calcula ponto em t
- `drawBezierCurve(plot, x0, y0, ..., color, samples)` - Desenha curva completa
- `drawBezierControlHull(plot, ...)` - Desenha polígono de controle
- `drawLineBresenhamInternal(plot, x1, y1, x2, y2, color)` - Bresenham inline

**Características:**
- Função de avaliação pura (sem efeitos colaterais)
- Amostragem parametrizada (padrão: 100 amostras)
- Bresenham embarcado para evitar dependências circulares
- Comentários detalhados em português

#### 2. **src/algorithms/hermite.js** (NOVO)

**Funções principais:**
- `evaluateHermite(P0, P1, T0, T1, t)` - Calcula ponto em t
- `drawHermiteCurve(plot, x0, y0, ..., color, samples)` - Desenha curva completa
- `drawHermiteControlHull(plot, ...)` - Desenha tangentes e pontos
- `drawLineBresenhamInternal(plot, x1, y1, x2, y2, color)` - Bresenham inline

**Características:**
- Polinômios de Hermite implementados literalmente
- Tangentes escaladas por 0.3 para visualização clara
- Amostragem parametrizada (padrão: 100 amostras)
- Cálculo de tangentes a partir de diferenças de pontos

#### 3. **src/core/state.js** (MODIFICADO)

**Alterações:**
```javascript
// Campo novo no estado
pendingPoints: []  // Acumula pontos enquanto usuário clica

// Novos tipos de modo
mode: 'select'|'dda'|'bresenham'|'circle'|'bezier'|'hermite'|'clip_cs'|'clip_lb'

// Novas funções de criação
addBezierToState(state, x0, y0, x1, y1, x2, y2, x3, y3)
addHermiteToState(state, x0, y0, x1, y1, tx0, ty0, tx1, ty1)
```

#### 4. **src/core/render.js** (MODIFICADO)

**Alterações:**
- Importação dos módulos bezier e hermite
- Casos de desenho para `type === 'bezier'` e `type === 'hermite'`
- Sistema de preview em tempo real
- Hull visual ao selecionar curvas

#### 5. **src/utils/geometry.js** (MODIFICADO)

**Funções novas:**
```javascript
bboxBezier(o)     // Bounding box conservador dos 4 pontos
bboxHermite(o)    // Bounding box com projeção de tangentes
```

**Funções estendidas:**
```javascript
objectCenter(o)   // Retorna centro de bezier/hermite
```

#### 6. **src/interaction/mouse.js** (MODIFICADO)

**Handlers novos:**
```javascript
// Modo bezier: coleta 4 cliques
if (state.mode === 'bezier') { ... }

// Modo hermite: coleta 4 cliques com feedback
if (state.mode === 'hermite') { ... }
```

#### 7. **index.html** (MODIFICADO)

**Botões adicionados:**
```html
<button data-mode="bezier" class="mode-btn">Bézier Cúbica</button>
<button data-mode="hermite" class="mode-btn">Hermite Cúbica</button>
```

#### 8. **main.js** (MODIFICADO)

**Correção em `onModeChange()`:**
```javascript
appState.pendingPoints = [];  // Limpar array ao mudar modo
```

---

## Arquitetura e Design

### Padrões de Design Utilizados

#### 1. **Injeção de Dependência (IoC)**

Os algoritmos recebem a função `plot(x, y, color)` como parâmetro:

```javascript
export function drawBezierCurve(plot, x0, y0, ..., color, samples = 100) {
  // plot é injetada, não importada
  plot(x, y, color);
}
```

**Benefícios:**
- Desacoplamento total do canvas
- Facilita testes
- Permite múltiplos "plotters"

#### 2. **Amostragem Paramétrica**

Ambas as curvas usam amostragem em lugar de métodos adaptativos:

```javascript
for (let i = 1; i <= samples; i++) {
  const t = i / samples;  // Divisão uniforme
  const point = evaluate(P0, P1, ..., t);
  drawLine(plot, prevPoint, point, color);
  prevPoint = point;
}
```

**Vantagens:**
- Simplicidade (didático)
- Previsibilidade (mesmo número de segmentos sempre)
- Sem complexidade adaptativa

**Desvantagem:**
- Menos eficiente em regiões retas (over-sampling)
- Menos suave em regiões curvas (under-sampling)

#### 3. **Bresenham Embarcado**

Para evitar dependência circular, Bresenham é reimplementado inline:

```javascript
// Em bezier.js e hermite.js
function drawLineBresenhamInternal(plot, x1, y1, x2, y2, color) {
  // Implementação completa de Bresenham
}
```

**Motivo:** 
- `bezier.js` não pode importar `bresenham.js`
- `bresenham.js` não pode importar `bezier.js`
- Evita ciclos de dependência

#### 4. **Estado Centralizado**

Toda a cena é armazenada em `state.objects`:

```javascript
objects: [
  { id: 1, type: 'line', x1, y1, x2, y2, algo },
  { id: 2, type: 'circle', xc, yc, r },
  { id: 3, type: 'bezier', x0, y0, x1, y1, x2, y2, x3, y3 },
  { id: 4, type: 'hermite', x0, y0, x1, y1, tx0, ty0, tx1, ty1 }
]
```

**Vantagens:**
- Serialização trivial
- Transformações uniformes
- Histórico simples

#### 5. **Render Centralizado**

Apenas `render.js` chama algoritmos de desenho:

```
mouse.js → onMouseDown()
         ↓
      state.objects[]
         ↓
render.js → drawObject() para cada objeto
         ↓
        canvas
```

**Vantagens:**
- Ordem de renderização clara
- Camadas implementáveis
- Debug simplificado

---

## Estrutura de Dados

### Objeto Bézier no Estado

```javascript
{
  id: number,                  // Identificador único
  type: 'bezier',              // Tipo de objeto
  x0: number, y0: number,      // P0 - ponto inicial
  x1: number, y1: number,      // P1 - 1º ponto de controle
  x2: number, y2: number,      // P2 - 2º ponto de controle
  x3: number, y3: number       // P3 - ponto final
}
```

**Exemplo:**
```javascript
{
  id: 42,
  type: 'bezier',
  x0: 100, y0: 150,
  x1: 150, y1: 100,
  x2: 350, y2: 200,
  x3: 400, y3: 150
}
```

### Objeto Hermite no Estado

```javascript
{
  id: number,                  // Identificador único
  type: 'hermite',             // Tipo de objeto
  x0: number, y0: number,      // P0 - ponto inicial
  x1: number, y1: number,      // P1 - ponto final
  tx0: number, ty0: number,    // T0 - tangente inicial (vetor)
  tx1: number, ty1: number     // T1 - tangente final (vetor)
}
```

**Exemplo:**
```javascript
{
  id: 43,
  type: 'hermite',
  x0: 200, y0: 150,
  x1: 600, y1: 150,
  tx0: 100, ty0: -100,    // Vetor: (100, -100)
  tx1: -100, ty1: -100    // Vetor: (-100, -100)
}
```

### Array pendingPoints

Armazena pontos enquanto o usuário está criando uma curva:

**Para Bézier (4 cliques):**
```javascript
pendingPoints = [
  { x: 100, y: 150 },  // P0
  { x: 150, y: 100 },  // P1
  { x: 350, y: 200 },  // P2
  { x: 400, y: 150 }   // P3
]
```

**Para Hermite (4 cliques):**
```javascript
pendingPoints = [
  { x: 200, y: 150 },  // P0
  { x: 600, y: 150 },  // P1
  { x: 250, y: 50  },  // T0_extremo (tangente visualizada)
  { x: 550, y: 50  }   // T1_extremo (tangente visualizada)
]
// Tangentes calculadas como:
// T0 = pendingPoints[2] - pendingPoints[0] = (50, -100)
// T1 = pendingPoints[3] - pendingPoints[1] = (-50, -100)
```

---

## Manual de Uso

### Interface Gráfica

A aplicação possui três painéis:

**Painel Esquerdo (Ferramentas):**
- 9 botões de modo (incluindo Bézier e Hermite)
- Modo ativo em azul

**Centro (Canvas):**
- Área de desenho 800×600
- HUD informativo
- Feedback visual de cliques

**Painel Direito (Transformações):**
- Sliders para translação, rotação, escala
- Botões de reflexão
- Opções de visualização

### Criando uma Curva de Bézier

**Passo 1:** Clique no botão **"Bézier Cúbica"**
- O botão ativa (fica azul)
- Modo muda para `'bezier'`

**Passo 2:** Clique 4 vezes no canvas para definir P0, P1, P2, P3
- **1º clique:** Define P0 (ponto inicial)
  - Cruz vermelha marca o ponto
  
- **2º clique:** Define P1 (1º ponto de controle)
  - Linha P0-P1 é desenhada em cinza
  - Duas cruzes marcam os pontos
  
- **3º clique:** Define P2 (2º ponto de controle)
  - Linha P1-P2 é desenhada em cinza
  - Três cruzes marcam os pontos
  
- **4º clique:** Define P3 (ponto final)
  - Curva suave é desenhada em branco
  - Polígono de controle é completado
  - `pendingPoints` é zerado

**Passo 3:** Selecione a curva
- Clique em "Selecionar" (ou outro modo)
- Clique sobre a curva para selecioná-la
- Hull de controle aparece em amarelo

**Passo 4:** Transforme a curva (opcional)
- Use os sliders de transformação
- Clique "Aplicar" para modificar a curva selecionada

### Criando uma Curva de Hermite

**Passo 1:** Clique no botão **"Hermite Cúbica"**
- O botão ativa (fica azul)
- Modo muda para `'hermite'`

**Passo 2:** Clique 4 vezes no canvas para definir P0, P1, T0, T1
- **1º clique:** Define P0 (ponto inicial)
  - Feedback: "Ponto inicial P0 definido."
  - Cruz vermelha marca o ponto
  
- **2º clique:** Define P1 (ponto final)
  - Feedback: "Ponto final P1 definido."
  - Linha P0-P1 é desenhada em cinza
  - Duas cruzes marcam os pontos
  
- **3º clique:** Define T0 (extremo da tangente inicial)
  - Feedback: "Extremo da tangente inicial T0 definido."
  - Linha P0-T0 é desenhada em cinza (vetor tangente)
  - Três cruzes marcam os pontos
  
- **4º clique:** Define T1 (extremo da tangente final)
  - Feedback: "Extremo da tangente final T1 definido."
  - Linha P1-T1 é desenhada em cinza (vetor tangente)
  - Curva suave é desenhada em branco
  - `pendingPoints` é zerado

**Passo 3:** Selecione a curva
- Clique em "Selecionar" (ou outro modo)
- Clique sobre a curva para selecioná-la
- Tangentes aparecem em amarelo com setas

**Passo 4:** Transforme a curva (opcional)
- Use os sliders de transformação
- Clique "Aplicar" para modificar a curva selecionada

### Interações Avançadas

#### Seleção Múltipla
- Clique em "Selecionar"
- Arraste para criar retângulo de seleção
- Todos os objetos dentro do retângulo são selecionados

#### Transformações
- **Translação:** Ajuste Δx e Δy, clique "Aplicar translação"
- **Rotação:** Ajuste graus (θ), clique "Aplicar rotação"
- **Escala:** Ajuste Sx e Sy, clique "Aplicar escala"
- **Reflexão:** Clique diretamente em "Reflexão X", "Reflexão Y" ou "Reflexão XY"

#### Reset
- Clique "Reset (tudo)" para limpar estado e sliders
- Clique "Limpar tela" para remover apenas objetos

---

## Exemplos de Uso

### Exemplo 1: Curva em S com Bézier

**Objetivo:** Criar uma curva em formato de "S"

**Cliques:**
1. P0 = (100, 300) - Inferior-esquerdo
2. P1 = (150, 100) - Puxa para cima-direita
3. P2 = (350, 500) - Puxa para baixo-esquerda
4. P3 = (400, 300) - Inferior-direito

**Resultado:** Curva suave com inflexão central

**Análise:**
- P0 e P3 próximos (mesmo Y) → extremos alinhados
- P1 acima (Y=100) → puxa primeira metade para cima
- P2 abaixo (Y=500) → puxa segunda metade para baixo
- Resultado: forma característica de "S"

### Exemplo 2: Montanha com Hermite

**Objetivo:** Criar pico de montanha com Hermite

**Cliques:**
1. P0 = (200, 150) - Ponto inicial (esquerda)
2. P1 = (600, 150) - Ponto final (direita, mesma altura)
3. T0_ext = (300, 50) - Tangente apontando para cima-direita
4. T1_ext = (500, 50) - Tangente apontando para cima-esquerda

**Tangentes calculadas:**
- T0 = (300, 50) - (200, 150) = (100, -100)
- T1 = (500, 50) - (600, 150) = (-100, -100)

**Resultado:** Arco simétrico com pico no meio (altura ~100)

**Análise:**
- P0 e P1 na mesma altura (Y=150) → pontos de entrada/saída alinhados
- Tangentes apontam para cima (T.y < 0 em coordenadas de tela)
- Simetria de tangentes → pico central simétrico

### Exemplo 3: Comparação Visual

**Setup:**
1. Desenhe uma Bézier com P0=(100,300), P1=(150,100), P2=(350,500), P3=(400,300)
2. Desenhe uma Hermite com P0=(100,300), P1=(400,300), e tangentes que passam pelos mesmos pontos P1 e P2

**Observações:**
- Bézier: Passa pelos extremos, mas não intermediários
- Hermite: Passa pelos extremos, reta em linha reta (sem intermediários)
- Diferença visual: Bézier segue mais o polígono de controle

---

## Decisões de Implementação

### 1. Número de Amostras (samples = 100)

**Decisão:** Usar 100 amostras por padrão

**Justificativa:**
- Canvas 800×600: ~480 pixels de diagonal máxima
- 100 amostras → ~5 pixels por segmento em média
- Suave visualmente sem overhead excessivo
- Parametrizável para casos especiais

**Alternativa não implementada:** Amostragem adaptativa (complexpor desnecessariamente para propósito educacional)

### 2. Escala de Tangentes em Hermite (scale = 0.3)

**Decisão:** Escalar tangentes por 0.3 para visualização

**Justificativa:**
- Tangentes podem ter magnitude arbitrária
- 0.3 do canvas (800px) = ~240px de comprimento máximo
- Facilita visualização sem obscurecer a curva
- Não afeta a curva matemática (interno é escalar = 1.0)

**Cálculo na visualização:**
```
vetor_visualizado = (P_extremo - P_base) * 0.3
```

### 3. Bresenham Inline (código duplicado)

**Decisão:** Reimplementar Bresenham em each arquivo instead of importing

**Justificativa:**
- Evita importação circular
- `bezier.js` não importa `bresenham.js`
- `hermite.js` não importa `bresenham.js`
- Cada módulo é independente

**Trade-off:**
- (+) Sem dependências circulares
- (-) Código duplicado (mas é trivial)

### 4. Amostragem Uniforme vs. Adaptativa

**Decisão:** Amostragem uniforme (t = i/samples)

**Justificativa:**
- Simples de entender (educacional)
- Previsível (sempre 100 segmentos)
- Sem complexidade adaptativa

**Limitação conhecida:**
- Regiões retas têm over-sampling
- Regiões curvas têm under-sampling
- Não é ótimo visualmente em todos os casos

**Melhoria futura:** Amostragem adaptativa baseada em curvatura

### 5. Estrutura pendingPoints como Array

**Decisão:** Usar array simples em vez de máquina de estados

**Justificativa:**
- Simples: `pendingPoints.length` indica progresso
- Flexível: Funciona para qualquer número de pontos
- Legível: Correspondência 1:1 com cliques

**Código:**
```javascript
if (pendingPoints.length === 4) {
  // Criar objeto
}
```

### 6. Hull Visual em Seleção

**Decisão:** Desenhar polígono de controle ao selecionar

**Justificativa:**
- Educacional: Mostra como a curva é influenciada
- Visual: Clareza sobre o que foi desenhado
- Interativo: Feedback imediato

**Cores:**
- Pontos intermediários: Cruzes pequenas
- Linhas: Mesma cor do hull (#fbbf24 = âmbar)

### 7. Feedback de Texto Estruturado

**Decisão:** Mensagens informativas para cada clique em Hermite

**Justificativa:**
- 4 cliques sem visualização clara confundem
- Hermite é mais abstrato que Bézier (tangentes)
- Feedback orienta o usuário

**Exemplo:**
```
"Ponto inicial P0 definido."
"Ponto final P1 definido."
"Extremo da tangente inicial T0 definido."
"Extremo da tangente final T1 definido."
```

---

## Referências Matemáticas

### Livros
- **Foley, van Dam, Feiner, Hughes.** *Computer Graphics: Principles and Practice in C* (2nd ed.). Addison-Wesley, 1996.
- **Rogers, Adams.** *Mathematical Elements for Computer Graphics* (2nd ed.). McGraw-Hill, 1990.

### Artigos
- **Bézier, Pierre.** "Numerical Control, Mathematics and Applications." Wiley, 1972.
- **Hermite, Charles.** "Sur l'interpolation." *Journal de Crelle*, vol. 64, pp. 70-79, 1865.

### Recursos Online
- [Cubic Bézier Curves - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Glossary/Bezier_curve)
- [Hermite Interpolation - Math Stack Exchange](https://math.stackexchange.com/questions/tagged/hermite)

---

## Conclusão

As curvas paramétricas cúbicas (Bézier e Hermite) foram implementadas de forma educacional e didática, com:

✅ **Modelo matemático completo** - Equações, polinômios e propriedades  
✅ **Código bem estruturado** - Módulos independentes, sem dependências circulares  
✅ **Interface amigável** - 4 cliques para criar cada curva  
✅ **Visualização clara** - Polígono de controle e tangentes em seleção  
✅ **Documentação extensiva** - Equações, exemplos e decisões explicadas  

O projeto demonstra a aplicabilidade prática de conceitos teóricos de Computação Gráfica em um contexto acessível e interativo.

---

**Documento atualizado em:** 23 de junho de 2026  
**Versão:** 1.0  
**Status:** Completo e testado
