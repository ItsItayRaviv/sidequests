export function Header(state) {
  const xp = Number(state.totalXP) || 0;
  const coins = Number(state.totalCoins) || 0;
  const levelTarget = 100;
  const xpWithinLevel = xp % levelTarget;
  const xpPercent = Math.min(100, Math.round((xpWithinLevel / levelTarget) * 100));

  return `
    <header class="header">
      <div class="header__auth">${AuthBar(state)}</div>
      <div class="header__stats">
        <div class="header__xp">
          <div class="header__xp-row">
            <span>XP</span>
            <span>${xpWithinLevel}/${levelTarget}</span>
          </div>
          <div class="header__progress">
            <div class="header__progress-fill" style="width: ${xpPercent}%;"></div>
          </div>
          <div class="header__xp-total">Total XP: ${xp}</div>
        </div>

        <div class="header__coins">
          <div class="header__coin-icon">$</div>
          <div>
            <div class="header__coins-label">Coins</div>
            <div class="header__coins-value">${coins}</div>
          </div>
        </div>
      </div>
    </header>
  `;
}

function AuthBar(state) {
  if (!state || state.loading) return "";

  if (state.isAnonymous) {
    return `
      <div class="auth-bar">
        <button class="btn btn-emerald auth-bar__btn" data-action="sign-in-google">
          Sign in with Google
        </button>
      </div>
    `;
  }

  const name = state.userDisplayName || state.userEmail || "Signed in";
  return `
    <div class="auth-bar auth-bar--signed">
      <div>
        <div class="auth-bar__name">${name}</div>
      </div>
    </div>
  `;
}
