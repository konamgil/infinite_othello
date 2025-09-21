import React from 'react';
import BattleMatchScreen from '../match/page';

/**
 * The page for initiating a ranked match.
 *
 * This component acts as a wrapper, rendering the generic `BattleMatchScreen`
 * with the `mode` prop set to 'ranked'. This allows for a dedicated route
 * for ranked matches while reusing the matchmaking UI.
 *
 * @returns {React.ReactElement} The rendered ranked match page.
 */
export default function RankedMatchPage() {
  return <BattleMatchScreen mode="ranked" />;
}