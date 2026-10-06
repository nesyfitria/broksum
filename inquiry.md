Boundaries : one or merged dates data of broksum

1. main table, inquiry: random IN date / emiten, Sort function
  a. broker
  b. Sum (value) as value_net
  c. sum (lot) as lot_net
  d. sum (freq) as freq_net
  e. Σ(lot × avg_price) untuk lot > 0  ÷  Σ lot untuk lot > 0 as avg_acc
  f. Σ(|lot| × harga) untuk lot < 0 ÷  Σ|lot| untuk lot < 0 as avg_dist
  g. Σ (|lot_i| × p_i) ÷ Σ |lot_i| as vwap
  h. |Σ(lot_i × p_i)| ÷ |Σ(lot_i)| as average_price_net


create view public.broksum_enriched_new as
with
  total_days as (
    select
      broksum."EMITEN",
      count(distinct broksum."DATE") as total_date
    from
      broksum
    group by
      broksum."EMITEN"
  ),
  base as (
    select
      b."DATE",
      b."BROKER",
      b."VALUE",
      b."LOT",
      b."FREQ",
      b."AVG PRICE",
      b."EMITEN",
      round(
        stddev(b."LOT") over (
          partition by
            b."EMITEN",
            b."BROKER"
        ),
        2
      ) as stddev_lot,
      round(
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
      round(
        avg(abs(b."LOT")) over (
          partition by
            b."EMITEN",
            b."BROKER"
        ),
        2
      ) as avg_abs_lot,
      sum(b."LOT") over (
        partition by
          b."EMITEN",
          b."BROKER"
      ) as total_net_lot,
      sum(b."LOT") over (
        partition by
          b."EMITEN",
          b."BROKER"
        order by
          b."DATE" rows between UNBOUNDED PRECEDING
          and CURRENT row
      ) as running_net_lot,
      sum(abs(b."LOT")) over (
        partition by
          b."EMITEN",
          b."BROKER"
      ) as volume_lot,
      sum(
        case
          when b."LOT" > 0 then b."LOT"
          else 0::bigint
        end
      ) over (
        partition by
          b."EMITEN",
          b."BROKER"
      ) as buy_lot,
      sum(
        case
          when b."LOT" < 0 then b."LOT"
          else 0::bigint
        end
      ) over (
        partition by
          b."EMITEN",
          b."BROKER"
      ) as sell_lot,
      abs(
        sum(
          case
            when b."LOT" < 0 then b."LOT"
            else 0::bigint
          end
        ) over (
          partition by
            b."EMITEN",
            b."BROKER"
        )
      ) / NULLIF(
        sum(
          case
            when b."LOT" > 0 then b."LOT"
            else 0::bigint
          end
        ) over (
          partition by
            b."EMITEN",
            b."BROKER"
        ),
        0::numeric
      ) as sell_buy_ratio,
      round(
        sum(abs(b."LOT")) over (
          partition by
            b."EMITEN",
            b."BROKER"
        ) / NULLIF(
          sum(b."FREQ") over (
            partition by
              b."EMITEN",
              b."BROKER"
          ),
          0
        )::numeric,
        2
      ) as freq_ratio,
      round(
        abs(b."LOT")::numeric / NULLIF(b."FREQ", 0)::numeric,
        2
      ) as freq_daily,
      round(
        sum(
          case
            when b."LOT" > 0 then b."LOT" * b."AVG PRICE"
            else 0::bigint
          end
        ) over (
          partition by
            b."EMITEN",
            b."BROKER"
        ) / NULLIF(
          sum(
            case
              when b."LOT" > 0 then b."LOT"
              else 0::bigint
            end
          ) over (
            partition by
              b."EMITEN",
              b."BROKER"
          ),
          0::numeric
        ),
        2
      ) as weighted_avg_buy_price,
      round(
        sum(
          case
            when b."LOT" < 0 then b."LOT" * b."AVG PRICE"
            else 0::bigint
          end
        ) over (
          partition by
            b."EMITEN",
            b."BROKER"
        ) / NULLIF(
          sum(
            case
              when b."LOT" < 0 then b."LOT"
              else 0::bigint
            end
          ) over (
            partition by
              b."EMITEN",
              b."BROKER"
          ),
          0::numeric
        ),
        2
      ) as weighted_avg_sell_price,
      round(
        sum(abs(b."LOT") * b."AVG PRICE") over (
          partition by
            b."EMITEN",
            b."BROKER"
        ) / NULLIF(
          sum(abs(b."LOT")) over (
            partition by
              b."EMITEN",
              b."BROKER"
          ),
          0::numeric
        ),
        2
      ) as weighted_avg_price,
      count(b."DATE") over (
        partition by
          b."EMITEN",
          b."BROKER"
      ) as broker_active_days,
      t.total_date as emiten_total_days,
      round(
        count(b."DATE") over (
          partition by
            b."EMITEN",
            b."BROKER"
        )::numeric / NULLIF(t.total_date, 0)::numeric,
        4
      ) as consistency
    from
      broksum b
      left join total_days t on b."EMITEN" = t."EMITEN"
  )
select
  "DATE",
  "BROKER",
  "VALUE",
  "LOT",
  "FREQ",
  "AVG PRICE",
  "EMITEN",
  stddev_lot,
  cv_lot,
  avg_abs_lot,
  total_net_lot,
  running_net_lot,
  volume_lot,
  round(total_net_lot / NULLIF(volume_lot, 0::numeric), 4) as net_bias,
  buy_lot,
  sell_lot,
  sell_buy_ratio,
  freq_ratio,
  freq_daily,
  weighted_avg_buy_price,
  weighted_avg_sell_price,
  weighted_avg_price,
  round(
    weighted_avg_sell_price - weighted_avg_buy_price,
    2
  ) as sell_buy_price_spread,
  broker_active_days,
  emiten_total_days,
  consistency
from
  base;
