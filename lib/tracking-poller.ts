/**
 * The loop of the tracking page (P1-16): asks the server for the request at once, then every 20 seconds, so a change of
 * status is on screen within 20 seconds plus one request.
 *
 * Nothing here knows React or the browser: the page hands in what it needs (the call, the clock, the timers, whether the tab is
 * hidden), so the loop is tested with a made-up clock. The rules:
 *
 * - the next try is counted from the START of the previous one, not from its end (a slow answer does not stretch the pace);
 * - one try at a time: the timer finding an answer still awaited asks nothing more; a request for a fresh answer (photos were just
 *   sent, an opinion was saved, the connection came back) is kept and made right after that try;
 * - a hidden tab does not ask; when it is shown again it asks at once if the last answer is 20 s old or more;
 * - after a failure the pace slows (20 s, 40 s, 80 s ... 2 min), and a good answer brings it back;
 * - a 404 means the server does not know this link: the loop stops for good;
 * - after `stop()` nothing is reported, whatever is still on its way.
 */
import {
  apiErrorStatus,
  isStale,
  nextRefreshDelay,
  statusChangeNotice,
  type TrackingIntervention,
} from '@/lib/shared';

export interface PollerDeps {
  /** One call to the server for this request. */
  load: () => Promise<TrackingIntervention>;
  now: () => number;
  /** True while the tab is not shown. */
  isHidden: () => boolean;
  setTimer: (run: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
  /** A good answer. `notice` is the sentence to announce when the status changed since the previous answer (never for the first one). */
  onAnswer: (job: TrackingIntervention, notice: string | null) => void;
  /** A try that failed (the number of failures in a row so far). */
  onFailure: (failures: number) => void;
  /** The server does not know this link. */
  onInvalid: () => void;
}

export class TrackingPoller {
  private stopped = false;
  private inFlight = false;
  /** A fresh answer was asked for while one was on its way: that one may date from before what the person just did. */
  private askAgain = false;
  private timer: unknown = null;
  private failures = 0;
  private lastAnswerAt: number | null = null;
  private lastStatus: string | null = null;

  constructor(private readonly deps: PollerDeps) {}

  /** Asks now, and keeps asking. */
  start(): void {
    void this.refresh();
  }

  /** Stops for good: no more calls, nothing more reported. */
  stop(): void {
    this.stopped = true;
    this.disarm();
  }

  private disarm(): void {
    if (this.timer !== null) {
      this.deps.clearTimer(this.timer);
      this.timer = null;
    }
  }

  /** The next try in 20 s, or later after failures (`failures` says how many to count: 0 when the try has not been made yet). */
  private arm(failures = this.failures): void {
    this.disarm();

    if (this.stopped) return;

    const delay = nextRefreshDelay({ hidden: this.deps.isHidden(), failures });

    // A hidden tab does not ask: `visibilityChanged()` asks the moment it is shown again.
    if (delay !== null) this.timer = this.deps.setTimer(() => void this.run(false), delay);
  }

  /** One try now (the connection came back, the person asked, or what they just did must show). */
  refresh(): Promise<void> {
    return this.run(true);
  }

  private async run(asked: boolean): Promise<void> {
    if (this.stopped) return;

    if (this.inFlight) {
      // The timer finding a try in progress changes nothing; a request for a fresh answer is made once this try is over.
      if (asked) this.askAgain = true;

      this.arm();

      return;
    }

    this.inFlight = true;
    // Counted from the start of this try, at the usual pace: a good answer leaves it as it is, a failure replaces it with a slower one.
    this.arm(0);

    try {
      const job = await this.deps.load();

      if (this.stopped) return;

      this.failures = 0;
      this.lastAnswerAt = this.deps.now();

      const notice = this.lastStatus === null ? null : statusChangeNotice(this.lastStatus, job.status);

      this.lastStatus = job.status;
      this.deps.onAnswer(job, notice);
    } catch (error) {
      if (this.stopped) return;

      // The server does not know this link (wrong, expired, or the request was deleted): nothing to ask again.
      if (apiErrorStatus(error) === 404) {
        this.stop();
        this.deps.onInvalid();

        return;
      }

      this.failures += 1;
      this.deps.onFailure(this.failures);
      this.arm();
    } finally {
      this.inFlight = false;

      if (this.askAgain) {
        this.askAgain = false;

        if (!this.stopped) void this.run(false);
      }
    }
  }

  /** The tab was hidden or shown. */
  visibilityChanged(): void {
    if (this.stopped) return;

    if (this.deps.isHidden()) {
      this.disarm();

      return;
    }

    if (isStale(this.lastAnswerAt, this.deps.now())) void this.refresh();
    else this.arm();
  }
}
