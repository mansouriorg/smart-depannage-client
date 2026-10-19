/**
 * The bot check as the request form lives it (P1-16): ask the server for a challenge, solve it in the background while the
 * person fills the form, wait out the minimum age, and hand the three fields over once.
 *
 * Nothing here knows React or the browser: what it needs from outside is handed in, so it is tested with a made-up server
 * and a made-up clock. The form (components/guest/request-wizard.tsx) holds one session and calls `prepare()` when it opens,
 * `take()` when the person sends, and `prepare()` again after a failure (a challenge is used once).
 */
import {
  botCheckBody,
  challengeExpired,
  solveChallenge,
  waitLeft,
  type BotChallenge,
  type BotCheckBody,
  type Sha256,
} from '@/lib/shared';

interface Solved {
  challenge: string;
  solution: string;
  receivedAt: number;
  waitMs: number;
  expiresInMs: number;
}

export interface BotCheckDeps {
  fetchChallenge: () => Promise<BotChallenge>;
  sha256: Sha256;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  /**
   * Whether a failed attempt is worth a second one. A refusal for too many tries is not: asking again would use one more
   * of the few the server allows. Every failure is retried once when this is not given.
   */
  retryable?: (error: unknown) => boolean;
}

/** The check could not be made (no connection to the server, or this browser cannot hash). Not the same as being refused. */
export class BotCheckUnavailable extends Error {
  /** What went wrong underneath (the failed call, or the browser's error), for the page to word. */
  readonly underlying: unknown;

  constructor(options?: { cause?: unknown }) {
    super('The security check could not be prepared.');
    this.name = 'BotCheckUnavailable';
    this.underlying = options?.cause;
    if (options?.cause !== undefined) (this as { cause?: unknown }).cause = options.cause;
  }
}

export class BotCheckSession {
  /** What is being prepared or is ready: null when the server asks for nothing. */
  private current: Promise<Solved | null> | null = null;
  private aborted = { aborted: false };

  constructor(private readonly deps: BotCheckDeps) {}

  /** Starts getting a challenge and solving it, unless one is already on its way. Never throws: `take()` reports a failure. */
  prepare(): void {
    if (!this.current) {
      this.current = this.fetchAndSolve();
      // A failure is reported by take(); this keeps it from being reported twice as "unhandled".
      this.current.catch(() => undefined);
    }
  }

  private async fetchAndSolve(): Promise<Solved | null> {
    // The signal of the moment this was started: `dispose()` stops the search that was under way, not a later one.
    const signal = this.aborted;
    const received = await this.deps.fetchChallenge();

    if (!received.enabled) return null;

    const receivedAt = this.deps.now();
    const solution = await solveChallenge(received.challenge, received.bits, this.deps.sha256, { signal });

    return { challenge: received.challenge, solution, receivedAt, waitMs: received.waitMs, expiresInMs: received.expiresInMs };
  }

  /** What is ready, replaced by a fresh one when it failed or got too old. */
  private async ready(): Promise<Solved | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      this.prepare();

      try {
        const solved = await (this.current as Promise<Solved | null>);

        if (solved && challengeExpired(solved.expiresInMs, solved.receivedAt, this.deps.now())) {
          this.current = null;
          continue;
        }

        return solved;
      } catch (error) {
        this.current = null;

        if (attempt === 1 || this.deps.retryable?.(error) === false) throw new BotCheckUnavailable({ cause: error });
      }
    }

    // Two challenges in a row were too old by the time they were solved.
    throw new BotCheckUnavailable();
  }

  /**
   * The fields to send with the form, after the wait the server asks for. The challenge is used up: the next `take()` (after a
   * `prepare()`, or by itself) gets another. `hiddenField` is what the page's hidden input holds.
   */
  async take(hiddenField = ''): Promise<BotCheckBody> {
    const solved = await this.ready();

    if (solved) {
      const wait = waitLeft(solved.waitMs, solved.receivedAt, this.deps.now());

      if (wait > 0) await this.deps.sleep(wait);
    }

    this.current = null;

    return botCheckBody(solved ? { challenge: solved.challenge, solution: solved.solution } : null, hiddenField);
  }

  /** Forgets what was prepared (the form was refused, or the person left). Stops a search in progress. */
  dispose(): void {
    this.aborted.aborted = true;
    this.current = null;
    this.aborted = { aborted: false };
  }
}
