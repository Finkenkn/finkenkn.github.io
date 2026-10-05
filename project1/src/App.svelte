<script>
  import hybridSketch from './assets/Hybrid_sketch.png';
</script>

<header class="titlebar">
  <h1>Smart Pillow</h1>
</header>

<main class="panes">
  <section class="pane">
    <!-- Physical rubber controls on the side of the pillow: embossed symbols and
         raised dots so they can be found by touch in the dark. No text, no lights. -->
    <div class="frame strip" data-strip>
      <button class="strip-btn" type="button" data-strip-action="alarm" aria-label="Silence alarm">
        <span class="dots one" aria-hidden="true"><i></i></span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
      </button>

      <div class="strip-ridge" aria-hidden="true"></div>

      <div class="strip-group" role="group" aria-label="Temperature">
        <svg class="strip-emboss" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /></svg>
        <button class="strip-btn" type="button" data-strip-action="temp-up" aria-label="Warmer">
          <span class="dots row" aria-hidden="true"><i></i><i></i><i></i></span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 6 20 17 4 17" /></svg>
        </button>
        <button class="strip-btn" type="button" data-strip-action="temp-down" aria-label="Cooler">
          <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 18 20 7 4 7" /></svg>
          <span class="dots row" aria-hidden="true"><i></i><i></i><i></i></span>
        </button>
      </div>

      <div class="strip-ridge" aria-hidden="true"></div>

      <div class="strip-group" role="group" aria-label="Softness">
        <svg class="strip-emboss" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6c3-1.5 13-1.5 16 0 1.2 4 1.2 8 0 12-3 1.5-13 1.5-16 0-1.2-4-1.2-8 0-12z" /></svg>
        <button class="strip-btn" type="button" data-strip-action="soft-up" aria-label="Softer">
          <span class="dots square" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 6 20 17 4 17" /></svg>
        </button>
        <button class="strip-btn" type="button" data-strip-action="soft-down" aria-label="Firmer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 18 20 7 4 7" /></svg>
          <span class="dots square" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        </button>
      </div>
    </div>
  </section>

  <div class="divider" role="separator" aria-orientation="vertical" tabindex="-1"></div>

  <section class="pane">
    <div class="frame box">
      <div class="tile alarm" data-page="alarms" tabindex="-1">
        <h3>Alarm</h3>
        <div class="alarm-next" data-alarm-next></div>
      </div>

      <div class="tiles">
        <div class="tile adjustable" data-page="temperature" tabindex="-1">
          <h3>Temperature</h3>
          <div class="adjust-row">
            <p class="adjust-value"><span data-temp>70</span><small>°F</small></p>
            <div class="temp-controls">
              <button class="temp-btn up" type="button" data-temp-step="1" aria-label="Increase temperature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 15 12 9 18 15" /></svg>
              </button>
              <button class="temp-btn down" type="button" data-temp-step="-1" aria-label="Decrease temperature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div class="tile adjustable">
          <h3>Softness</h3>
          <div class="adjust-row">
            <div>
              <p class="adjust-value"><span data-softness>5</span><small>/10</small></p>
              <p data-softness-label>Medium</p>
            </div>
            <div class="temp-controls">
              <button class="temp-btn soft" type="button" data-softness-step="1" aria-label="Softer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 15 12 9 18 15" /></svg>
              </button>
              <button class="temp-btn soft" type="button" data-softness-step="-1" aria-label="Firmer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div class="tile sleep" data-page="sleep" tabindex="-1">
          <h3>Sleep History</h3>
          <div class="sleep-tile-chart" data-sleep-chart></div>
          <p class="sleep-foot">
            <span>Week avg <span data-sleep-avg></span> h</span>
            <span class="snore-key">Snoring</span>
          </p>
        </div>
      </div>

      <div class="page-backdrop" data-close></div>

      <section class="page" data-page="temperature" aria-label="Temperature settings">
        <button class="back" type="button" data-close aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 6 9 12 15 18" /></svg>
        </button>
        <div class="page-content">
          <header class="page-head">
            <h2>Temperature</h2>
          </header>
          <div class="page-body temp-page">
            <div class="temp-now">
              <span class="temp-now-label">Now</span>
              <button class="temp-btn up" type="button" data-temp-step="1" aria-label="Increase temperature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 15 12 9 18 15" /></svg>
              </button>
              <div class="temp-readout"><span data-temp>70</span>°</div>
              <button class="temp-btn down" type="button" data-temp-step="-1" aria-label="Decrease temperature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
            </div>

            <div class="temp-plan">
              <div class="segmented" role="group" aria-label="Temperature plan">
                <button type="button" data-temp-mode="schedule" aria-pressed="true">Schedule</button>
                <button type="button" data-temp-mode="liedown" aria-pressed="false">When I lie down</button>
              </div>

              <div class="plan-panel" data-temp-panel="schedule">
                <div class="timeline" data-timeline>
                  <svg class="timeline-line" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">
                    <path class="area" data-timeline-area />
                    <path class="line" data-timeline-line />
                  </svg>
                  <div class="timeline-now" data-timeline-now></div>
                </div>
                <div class="timeline-axis" aria-hidden="true">
                  <span style="left: 0%">12p</span>
                  <span style="left: 8.333%">2p</span>
                  <span style="left: 16.667%">4p</span>
                  <span style="left: 25%">6p</span>
                  <span style="left: 33.333%">8p</span>
                  <span style="left: 41.667%">10p</span>
                  <span style="left: 50%">12a</span>
                  <span style="left: 58.333%">2a</span>
                  <span style="left: 66.667%">4a</span>
                  <span style="left: 75%">6a</span>
                  <span style="left: 83.333%">8a</span>
                  <span style="left: 91.667%">10a</span>
                  <span style="left: 100%">12p</span>
                </div>
                <div class="timeline-status">
                  <p class="hint" data-timeline-hint></p>
                  <button class="remove-btn" type="button" data-timeline-remove hidden>Remove</button>
                </div>
              </div>

              <div class="plan-panel liedown" data-temp-panel="liedown" hidden>
                <div class="plan-field">
                  <span>Change to</span>
                  <div class="stepper">
                    <button class="temp-btn down" type="button" data-liedown-temp="-1" aria-label="Lower target temperature">&minus;</button>
                    <span class="stepper-value"><span data-liedown-temp-value>68</span>°F</span>
                    <button class="temp-btn up" type="button" data-liedown-temp="1" aria-label="Raise target temperature">+</button>
                  </div>
                </div>
                <div class="plan-field">
                  <span>After lying down for</span>
                  <div class="stepper">
                    <button class="temp-btn" type="button" data-liedown-delay="-5" aria-label="Shorter delay">&minus;</button>
                    <span class="stepper-value"><span data-liedown-delay-value>15</span> min</span>
                    <button class="temp-btn" type="button" data-liedown-delay="5" aria-label="Longer delay">+</button>
                  </div>
                </div>
                <p class="hint">The pillow senses the weight of your head to know when you've lain down.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="page" data-page="sleep" aria-label="Sleep history">
        <button class="back" type="button" data-close aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 6 9 12 15 18" /></svg>
        </button>
        <div class="page-content">
          <header class="page-head">
            <h2>Sleep History</h2>
          </header>
          <div class="page-body sleep-page">
            <dl class="sleep-stats" data-sleep-stats></dl>
            <p class="sleep-legend hint">
              <span class="move-key">Movement during sleep</span>
              <span class="snore-key">Snoring</span>
            </p>
            <ol class="sleep-list" data-sleep-list></ol>
            <p class="hint sleep-empty" data-sleep-empty hidden>No sleep recorded yet.</p>
          </div>
        </div>
      </section>

      <section class="page" data-page="alarms" aria-label="Alarms">
        <button class="back" type="button" data-close aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 6 9 12 15 18" /></svg>
        </button>
        <div class="page-content">
          <header class="page-head">
            <h2>Alarms</h2>
          </header>
          <div class="page-body alarms-page">
            <ul class="alarm-list" data-alarm-list></ul>
            <p class="hint alarm-empty" data-alarm-empty hidden>No alarms yet.</p>
            <button class="text-btn add" type="button" data-alarm-add>+ Add alarm</button>
          </div>
        </div>
      </section>

      <!-- Alarm editor: a smaller page that opens on top of the alarms page -->
      <div class="page-backdrop over" data-close></div>

      <section class="page editor" data-page="alarm-edit" aria-label="Edit alarm">
        <div class="page-content">
          <div class="page-body editor-page">
            <div class="dial-wrap">
              <svg class="dial" data-dial data-autofocus viewBox="-100 -100 200 200" role="slider" tabindex="0" aria-valuenow="7">
                <circle class="dial-face" r="98" />
                <g class="dial-ticks" data-dial-ticks></g>
                <g class="dial-hand" data-dial-hand>
                  <line x1="0" y1="0" x2="0" y2="-74" />
                  <circle class="dial-knob" cy="-74" r="14" />
                  <circle class="dial-knob-dot" cy="-74" r="2.5" data-dial-dot />
                </g>
                <circle class="dial-center" r="3.5" />
                <g class="dial-numbers" data-dial-numbers></g>
              </svg>
            </div>

            <div class="editor-side">
              <div class="editor-time">
                <div class="readout">
                  <button class="readout-hour" type="button" data-dial-part="hour" aria-label="Set hour"></button>
                  <span aria-hidden="true">:</span>
                  <button type="button" data-dial-part="minute" aria-label="Set minute"></button>
                </div>
                <div class="segmented ampm" role="group" aria-label="AM or PM">
                  <button type="button" data-ampm="am">AM</button>
                  <button type="button" data-ampm="pm">PM</button>
                </div>
              </div>
              <p class="hint" data-dial-hint></p>

              <div class="editor-field">
                <label class="editor-label" for="alarm-label">Label</label>
                <input class="text-input" id="alarm-label" type="text" maxlength="30" placeholder="Optional" autocomplete="off" data-alarm-label />
              </div>

              <div class="editor-field">
                <span class="editor-label">Repeat</span>
                <div class="day-picks" role="group" aria-label="Repeat on">
                  <button type="button" data-day="0" aria-label="Sunday">Sun</button>
                  <button type="button" data-day="1" aria-label="Monday">Mon</button>
                  <button type="button" data-day="2" aria-label="Tuesday">Tue</button>
                  <button type="button" data-day="3" aria-label="Wednesday">Wed</button>
                  <button type="button" data-day="4" aria-label="Thursday">Thu</button>
                  <button type="button" data-day="5" aria-label="Friday">Fri</button>
                  <button type="button" data-day="6" aria-label="Saturday">Sat</button>
                </div>
                <p class="hint" data-repeat-hint></p>
              </div>

              <div class="editor-field row">
                <div>
                  <span class="editor-label" id="gradual-label">Gradual wake-up</span>
                  <p class="hint" data-gradual-hint></p>
                </div>
                <button class="switch" type="button" role="switch" aria-checked="true" data-gradual aria-labelledby="gradual-label"></button>
              </div>

              <div class="editor-actions">
                <button class="text-btn danger" type="button" data-alarm-delete>Delete</button>
                <button class="text-btn" type="button" data-close>Cancel</button>
                <button class="text-btn primary" type="button" data-alarm-save>Save</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>

  <div class="divider" role="separator" aria-orientation="vertical" tabindex="-2"></div>

  <section class="pane">
    <div class="frame image">
      <img src={hybridSketch} alt="Sketch of the smart pillow by a bed: bedside screen and side control strip, both wired to the pillow" />
    </div>
  </section>

</main>