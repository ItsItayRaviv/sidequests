export function Header(state) {
  const xp = Number(state.totalXP) || 0;
  const coins = Number(state.totalCoins) || 0;
  const levelTarget = 100;
  const xpWithinLevel = xp % levelTarget;
  const xpPercent = Math.min(100, Math.round((xpWithinLevel / levelTarget) * 100));

  return `
    <header class="header">
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
    </header>
  `;
}
