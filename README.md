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
- Segure `Espaço` ou o botão de recolher para controlar a zona verde da pesca.
- Cada peixe capturado é invocado imediatamente pelo lado esquerdo da pista.
- O time inimigo invoca automaticamente peixes diferentes pelo lado direito.
- As equipes caminham, atacam e destroem o cais adversário automaticamente.
- Cada vez que o cais rival é destruído, a vida das próximas invocações inimigas aumenta 10% cumulativamente.
- A cada 60 segundos, um dos três bosses é invocado pelo time inimigo.
- Abates e destruição do cais rival rendem moedas para melhorar vara e molinete.

O progresso da oficina e as moedas são salvos automaticamente no navegador.
