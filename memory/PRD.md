# Maré Alta — Previsão do Tempo para Pescadores

## Problema (original)
Pescador (beira de praia, mar aberto, rios da bacia amazônica/mato-grossense e barragens de SP)
precisa de uma landing page de previsão do tempo com dados equivalentes ao Nautitude e Windy.

## Decisões / User choices
- Dados: **Open-Meteo** (gratuito, sem chave) para previsão + marinha; **Windy** apenas como widget de mapa embutido (iframe).
- Locais: presets (Mar Aberto/Litoral SP, Bacia Amazônica, Mato Grosso, Barragens SP) + busca livre (geocoding).
- Prioridade: **pressão atmosférica** e **vento (direção + velocidade em km/h)**.
- Idioma pt-BR, tema claro (editorial náutico). Sem login; favoritos via localStorage.

## Arquitetura
- Backend FastAPI (`/app/backend/server.py`): `/api/presets`, `/api/geocode`, `/api/weather` (forecast+marine via asyncio.gather no Open-Meteo), `/api/favorites` (CRUD Mongo). Cálculos astronômicos: fase da lua, solunar, estimativa de marés.
- Frontend React (Lenis smooth scroll + framer-motion + react-fast-marquee). Fontes: Cormorant Garamond (títulos) + IBM Plex Mono (dados).
- Componentes: Header (busca/presets/favoritos), Hero cinético, MarqueeBar, Dashboard (bento grid), WeatherCards, Manifesto, Footer.

## Implementado (2025-12)
- Landing kinética + dashboard funcional com dados reais (vento km/h, pressão+tendência, ondas/swell/temp água, marés estimadas, solunar, fase da lua, previsão horária + 7 dias, mapa Windy embutido).
- Favoritos em localStorage. Busca por geocoding. 12 locais pré-configurados.
- **Seletor de período (Início/Fim, dd/mm/aa)**: presets (Hoje/7/14 dias) + calendário de intervalo (shadcn). Backend usa start_date/end_date do Open-Meteo (clamp: -92d a +15d). Card de dias vira "Período · N dias". Guard de request-id evita respostas fora de ordem.
- Testes: backend 17/17 pytest OK, frontend E2E 100% OK (iteration_1 e iteration_2).

## Notas
- Marés e solunar são ESTIMATIVAS astronômicas (rotuladas na UI). Dados marítimos só em pontos costeiros/oceânicos.
- Windy API oficial é paga (990€/ano) e proibida para uso pessoal — por isso usamos só o widget de mapa gratuito.

## Backlog (próximos)
- P1: Tábua de marés oficial (integração paga WorldTides/Marea) para precisão real.
- P1: Alertas de condição (ex.: pressão caindo, rajadas > X km/h) e notificação.
- P2: Comparar múltiplos locais lado a lado; gráfico de pressão/vento (recharts).
- P2: PWA / instalação no notebook offline-first.
