import { useEffect, useRef, useState } from 'react';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
} from 'chart.js';
import type { ContagemEntry } from '../lib/aggregate';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

interface Props {
  title: string;
  hint: string;
  ariaLabel: string;
  entries: ContagemEntry[];
  barColor: string;
  placeholder: string;
}

export function BarChartPanel({ title, hint, ariaLabel, entries, barColor, placeholder }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: entries.map((e) => e.label),
        datasets: [
          {
            data: entries.map((e) => e.count),
            backgroundColor: barColor,
            borderRadius: 4,
            maxBarThickness: 18,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        resizeDelay: 150,
        maintainAspectRatio: false,
        onHover: (evt, elements) => {
          const target = evt.native?.target as HTMLElement | undefined;
          if (target) target.style.cursor = elements.length ? 'pointer' : 'default';
        },
        onClick: (_evt, elements, chart) => {
          if (!elements.length) return;
          const label = chart.data.labels?.[elements[0].index] as string;
          setSelected((prev) => (prev === label ? null : label));
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.x} demanda(s)` } },
        },
        scales: {
          x: { grid: { color: '#333C4A' }, ticks: { color: '#B7B5B6', font: { size: 11 }, precision: 0 } },
          y: { grid: { display: false }, ticks: { color: '#B7B5B6', font: { size: 11 }, autoSkip: false } },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, barColor]);

  // Se os dados mudarem e a seleção atual deixar de existir, limpa a seleção.
  useEffect(() => {
    if (selected && !entries.some((e) => e.label === selected)) {
      setSelected(null);
    }
  }, [entries, selected]);

  const selecionado = entries.find((e) => e.label === selected) ?? null;

  return (
    <div className="panel chart-panel">
      <p className="panel-title">{title}</p>
      <p className="panel-hint">{hint}</p>
      <div className="chart-wrap">
        <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
      </div>
      <div className="detail-list">
        {!selecionado ? (
          <div className="detail-empty">{placeholder}</div>
        ) : (
          <>
            <div className="detail-header">
              <span>
                {selecionado.label} · {selecionado.count} demanda(s)
              </span>
              <button className="detail-clear" onClick={() => setSelected(null)} aria-label="Limpar seleção">
                Limpar ×
              </button>
            </div>
            {selecionado.itens.length === 0 ? (
              <div className="detail-empty">Nenhuma demanda encontrada.</div>
            ) : (
              selecionado.itens.map((d) => (
                <div className="detail-item" key={d.id}>
                  <span style={{ color: 'var(--text)' }}>{d.nome}</span>
                  <span>{d.cliente || '—'}</span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
