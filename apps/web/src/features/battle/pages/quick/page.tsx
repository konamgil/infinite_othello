import React from 'react';
import BattleMatchScreen from '../match/page';

/**
 * The page for initiating a quick match.
 *
 * This component acts as a wrapper, rendering the generic `BattleMatchScreen`
 * with the `mode` prop set to 'quick'. This allows for a dedicated route
 * for quick matches while reusing the matchmaking UI.
 *
 * @returns {React.ReactElement} The rendered quick match page.
 */
export default function QuickMatchPage() {
  return <BattleMatchScreen mode="quick" />;
}