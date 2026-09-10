# Rinha do Rio

Jogo 2D de pesca e batalha automática feito em HTML, CSS e JavaScript puro.

A pista usa um cenário pixel art próprio com cais rivais, rio ao pôr do sol e plataforma de batalha.

## Jogar

```bash
python3 -m http.server 8000
```

Acesse `http://localhost:8000`.

## Como funciona

- A tela principal é dividida horizontalmente: batalha em cima e pesca embaixo.
- A pesca funciona como um tycoon: os pescadores capturam peixes automaticamente.
- Use moedas para contratar até 20 pescadores e acelerar a produção da equipe.
- Cada peixe capturado é invocado imediatamente pelo lado esquerdo da pista.
- O time inimigo invoca automaticamente peixes diferentes pelo lado direito.
- As equipes caminham, atacam e destroem o cais adversário automaticamente.
- Cada vez que o cais rival é destruído, o dano das próximas invocações inimigas aumenta 1 ponto cumulativamente.
- A cada 60 segundos, um dos três bosses é invocado pelo time inimigo.
- Abates e destruição do cais rival rendem moedas para contratar pescadores e melhorar o equipamento.
- O treino de combate não tem nível máximo: cada compra dá +10 de dano aos peixes aliados e custa o dobro da anterior, começando em 100 moedas.

O progresso da oficina e as moedas são salvos automaticamente no navegador.
