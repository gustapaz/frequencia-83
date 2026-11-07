# Frequência 83

Modo integrado. Uma cabine fictícia de rádio para ouvir vinhetas originais sintetizadas, ordenar até seis peças e compartilhar uma sequência. A criação de playlists do [Spotify](https://support.spotify.com/article/create-playlists/) inspirou a fila reproduzível. Marca, composição e sons são próprios.

GET /api/clips devolve os dados sintéticos e partituras. POST /api/mixes recebe {clips}, lista ordenada de IDs conhecidos; 201 devolve id e expires. GET /api/mixes/:id recupera a sequência por sete dias. SQLite/D1 limita o arquivo a 2.000 sequências e remove registros expirados em novas gravações. Nenhuma conta, upload, dado pessoal ou serviço pago. Cliente Lit e Web Audio, validação Zod, Worker HTTP.
