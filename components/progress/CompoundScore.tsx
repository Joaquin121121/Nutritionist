'use client';

interface CompoundScoreProps {
  score: number;
}

export function CompoundScore({ score }: CompoundScoreProps) {
  const rounded = Math.round(score);
  const note =
    rounded >= 75
      ? 'Excelente semana. Vas por encima de tu objetivo.'
      : rounded >= 50
      ? 'Buen ritmo. Un par de hábitos por reforzar.'
      : 'Semana floja. Retomá tus hábitos clave.';

  return (
    <div className="score-card">
      <span className="eyebrow">Puntuación General</span>
      <div className="score-num">
        {rounded}
        <small>/100</small>
      </div>
      <div className="score-bar">
        <span style={{ width: `${Math.min(100, rounded)}%` }} />
      </div>
      <p className="score-note">{note}</p>
    </div>
  );
}
