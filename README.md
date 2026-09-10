# Rinha do Rio

Jogo 2D de pesca e combate feito em HTML, CSS e JavaScript puro.

## Jogar

Abra `index.html` no navegador ou, nesta pasta, execute:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Controles

- Pesca: segure `Espaço` ou o botão para subir a zona de captura; solte para descer.
- Arena: `A` e `D` movem, `J` usa ataque leve, `K` usa ataque pesado e `L` esquiva.
- Os botões na tela também funcionam com mouse e toque.

O progresso é salvo automaticamente no navegador.

O pescador possui animação própria de arremesso e recolhimento. Ao entrar na arena,
cada peixe assume uma forma humanoide animada com poses de ataque leve, ataque
pesado, esquiva e dano. Durante o deslocamento, um ciclo de quatro quadros anima
a caminhada dos lutadores com os pés presos à linha do chão.

Cada espécie possui sua própria folha de sprites e silhueta na arena: Lambari ágil,
Tilápia robusta, Traíra predatória, Dourado atlético, Pirarucu gigante e Bagre
Fantasma espectral.

Após cinco lutas comuns, o próximo combate é obrigatoriamente contra um dos três
chefes do rio: Rei Carniça, Barão do Lodo ou Voltágua. O contador reinicia depois
do confronto com o boss, independentemente do resultado.
