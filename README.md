# FinAnalytics Core

**FinAnalytics Core** — аналитическое ядро для сервиса портфельной аналитики нового поколения: не просто `PnL/ROI`, а «дыхание портфеля» в реальном времени.

Проект стартует как отдельный продукт, вдохновлённый идеей сделать аналитику лучше, чем стандартные брокерские интерфейсы: глубже, понятнее, чувствительнее к риску, просадке, режимам рынка и стрессу.

## Что уже есть

- Batch-расчёт equity-кривой по CSV сделок.
- Базовые метрики:
  - Breath Score
  - current/max drawdown
  - Ulcer Index
  - CAGR
  - Pain Ratio
  - annualized volatility
  - autocorr(1)
  - rough Hurst R/S
  - recovery time bars
- Realtime Engine с кольцевым буфером.
- Regime detector: простая эвристика по волатильности и автокорреляции.
- Stress Engine:
  - sigma-сценарии `-1σ/-2σ/-3σ`
  - упрощённый liquidity stress
- FastAPI demo API + WebSocket.
- Минимальный UI `/demo`.
- Pytest-тесты ядра.
- Документация для Claude в `docs/CLAUDE_SPEC_RU.md`.

## Быстрый старт

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest -q
python server.py
```

В другом терминале:

```bash
curl -X POST "http://localhost:8000/api/ingest/csv?csv=sample_trades.csv&initial_cash=10000"
curl "http://localhost:8000/api/metrics"
```

Открыть UI:

```text
http://localhost:8000/demo
```

## Структура

```text
finanalytics-core/
  fin_core/
    datatypes.py
    equity_builder.py
    metrics_base.py
    metrics_regime.py
    stress_engine.py
    feature_store.py
    stream/
      ring_buffer.py
      bus_interface.py
      realtime_engine.py
    adapters/
      csv_loader.py
      tradernet.py
      crypto_ccxt.py
  tests/
  docs/
  server.py
  sample_trades.csv
  web_index.html
  web_app.js
```

## Главная идея

Обычная аналитика говорит: «портфель вырос/упал».  
FinAnalytics должен говорить: **как именно портфель переживает среду**.

То есть:

- где он дышит ровно;
- где входит в спазм;
- где дроудаун становится не просто цифрой, а режимом боли;
- где рынок сменил фазу;
- где стресс-сценарий показывает скрытую хрупкость.

## Следующий этап

Claude должен продолжать с фокуса на аналитическом ядре:

1. Усилить `fin_core`.
2. Улучшить realtime-расчёты.
3. Добавить адаптеры Tradernet и крипты как стабильные интерфейсы.
4. Версионировать формулы и веса.
5. Довести тесты и документацию до уровня grant/product-ready.

См. `docs/CLAUDE_SPEC_RU.md`.
