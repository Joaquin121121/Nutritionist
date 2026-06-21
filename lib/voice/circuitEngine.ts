/**
 * Circuit session state machine.
 *
 * Pure logic, no DOM. Feed it "make"/"miss" outcomes; it tracks the current
 * circuit / spot, and returns the events that just happened so the caller can
 * fire voice feedback and re-render. A circuit has `spots` positions, each with
 * `shotsPerSpot` shots; finishing a spot's shots advances to the next spot,
 * finishing the last spot advances to the next circuit, finishing the last
 * circuit ends the session.
 */
import type { Circuit, CircuitResult, ShotOutcome } from '@/types';

export type SessionEvent =
  | { type: 'shot'; outcome: ShotOutcome; circuitIndex: number; spotIndex: number }
  | {
      type: 'spot-complete';
      circuitIndex: number;
      spotIndex: number;
      nextSpotIndex: number;
      makes: number;
      attempts: number;
    }
  | {
      type: 'circuit-complete';
      circuitIndex: number;
      makes: number;
      attempts: number;
      pct: number;
      nextCircuit: Circuit | null;
    }
  | { type: 'session-complete'; totalMakes: number; totalAttempts: number; pct: number }
  | { type: 'time-expired'; totalMakes: number; totalAttempts: number; pct: number };

export interface SessionSnapshot {
  status: 'active' | 'finished';
  circuitIndex: number;
  spotIndex: number;
  results: CircuitResult[];
}

function emptyResults(circuits: Circuit[]): CircuitResult[] {
  return circuits.map((c) => ({
    id: c.id,
    name: c.name,
    makes: 0,
    attempts: 0,
    spots: Array.from({ length: c.spots }, () => ({ makes: 0, attempts: 0 })),
  }));
}

export class CircuitSession {
  readonly circuits: Circuit[];
  private results: CircuitResult[];
  private circuitIndex = 0;
  private spotIndex = 0;
  private finished = false;

  constructor(circuits: Circuit[]) {
    this.circuits = circuits;
    this.results = emptyResults(circuits);
  }

  snapshot(): SessionSnapshot {
    return {
      status: this.finished ? 'finished' : 'active',
      circuitIndex: this.circuitIndex,
      spotIndex: this.spotIndex,
      // deep-ish copy so React sees new references
      results: this.results.map((r) => ({
        ...r,
        spots: r.spots.map((s) => ({ ...s })),
      })),
    };
  }

  get isFinished(): boolean {
    return this.finished;
  }

  totals(): { makes: number; attempts: number; pct: number } {
    let makes = 0;
    let attempts = 0;
    for (const r of this.results) {
      makes += r.makes;
      attempts += r.attempts;
    }
    return { makes, attempts, pct: attempts ? (makes / attempts) * 100 : 0 };
  }

  /**
   * End the session early (e.g. the workout timer ran out). Marks it finished
   * and returns a single `time-expired` event carrying the totals-so-far. A
   * no-op (empty events) if the session already finished.
   */
  forceFinish(): SessionEvent[] {
    if (this.finished) return [];
    this.finished = true;
    const t = this.totals();
    return [
      {
        type: 'time-expired',
        totalMakes: t.makes,
        totalAttempts: t.attempts,
        pct: t.pct,
      },
    ];
  }

  /** Record one outcome, returning the ordered events it triggered. */
  record(outcome: ShotOutcome): SessionEvent[] {
    if (this.finished) return [];

    const events: SessionEvent[] = [];
    const circuit = this.circuits[this.circuitIndex];
    const result = this.results[this.circuitIndex];
    const spot = result.spots[this.spotIndex];

    spot.attempts += 1;
    result.attempts += 1;
    if (outcome === 'make') {
      spot.makes += 1;
      result.makes += 1;
    }
    events.push({
      type: 'shot',
      outcome,
      circuitIndex: this.circuitIndex,
      spotIndex: this.spotIndex,
    });

    if (spot.attempts < circuit.shotsPerSpot) return events;

    // spot is complete
    const isLastSpot = this.spotIndex >= circuit.spots - 1;
    if (!isLastSpot) {
      const nextSpotIndex = this.spotIndex + 1;
      events.push({
        type: 'spot-complete',
        circuitIndex: this.circuitIndex,
        spotIndex: this.spotIndex,
        nextSpotIndex,
        makes: spot.makes,
        attempts: spot.attempts,
      });
      this.spotIndex = nextSpotIndex;
      return events;
    }

    // circuit is complete
    const isLastCircuit = this.circuitIndex >= this.circuits.length - 1;
    const pct = result.attempts ? (result.makes / result.attempts) * 100 : 0;
    events.push({
      type: 'circuit-complete',
      circuitIndex: this.circuitIndex,
      makes: result.makes,
      attempts: result.attempts,
      pct,
      nextCircuit: isLastCircuit ? null : this.circuits[this.circuitIndex + 1],
    });

    if (isLastCircuit) {
      this.finished = true;
      const t = this.totals();
      events.push({
        type: 'session-complete',
        totalMakes: t.makes,
        totalAttempts: t.attempts,
        pct: t.pct,
      });
    } else {
      this.circuitIndex += 1;
      this.spotIndex = 0;
    }
    return events;
  }
}
