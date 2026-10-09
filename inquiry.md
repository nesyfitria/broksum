Boundaries : one or merged dates data of broksum

1. main table, inquiry: random IN date / emiten, Sort function
- broker
- emiten
- Sum (value) as value_net
- sum (lot) as lot_net
- sum (abs(lot)) as volume
- lot_net / volume as bias_net
- sum (freq) as freq_net
- Σ(lot × avg_price) untuk lot > 0  ÷  Σ lot untuk lot > 0 as avg_acc
- Σ(|lot| × harga) untuk lot < 0 ÷  Σ|lot| untuk lot < 0 as avg_dist
- avg_acc - avg_dist as price
- Σ (|lot_i| × p_i) ÷ Σ |lot_i| as vwap
- Σ(lot_i × p_i)| ÷ |Σ(lot_i)| as average_price_net
- sum(case when b."LOT" < 0 then b."LOT" as sell_lot,
- sum(case when b."LOT" > 0 then b."LOT" as buy_lot,
- sttdev (lot) as sttdev
- round(
        stddev(b."LOT") over (
          partition by
            b."EMITEN",
            b."BROKER"
        ) / NULLIF(
          avg(abs(b."LOT")) over (
            partition by
              b."EMITEN",
              b."BROKER"
          ),
          0::numeric
        ),
        4
      ) as cv_lot,
  
  - count(b."DATE") over (
        partition by
          b."EMITEN",
          b."BROKER"
      ) as broker_active_days,
  
  - t.total_date as emiten_total_days,
      round(
        count(b."DATE") over (
          partition by
            b."EMITEN",
            b."BROKER"
        )::numeric / NULLIF(t.total_date, 0)::numeric,
        4
      ) as consistency
 

