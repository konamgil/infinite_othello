import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../../store/gameStore';
import { ProfileStarCanvas } from '../../../../ui/profile/ProfileStarCanvas';
import { ArrowLeft, Trophy, Star } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { player } = useGameStore();

  return (
    <div className="h-full w-full overflow-hidden relative">
      <div className="absolute inset-0">
        <ProfileStarCanvas className="w-full h-full" />
      </div>
      <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
        <div className="content-padding section-spacing pb-32 space-y-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>뒤로</span>
          </button>

          <section className="p-6 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md space-y-4">
            <header className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <Trophy className="text-yellow-400" size={28} />
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-display font-bold text-white">{player.name}</h1>
                <p className="text-sm text-white/60">{player.rank} · RP {player.rp}</p>
              </div>
            </header>

            <dl className="grid grid-cols-2 gap-4 text-sm text-white/70">
              <div>
                <dt className="text-white/50">승리</dt>
                <dd className="text-lg font-semibold text-green-400">{player.wins}</dd>
              </div>
              <div>
                <dt className="text-white/50">패배</dt>
                <dd className="text-lg font-semibold text-red-400">{player.losses}</dd>
              </div>
              <div>
                <dt className="text-white/50">현재 층</dt>
                <dd className="text-lg font-semibold text-purple-300">{player.currentFloor}</dd>
              </div>
              <div>
                <dt className="text-white/50">최고 랭크</dt>
                <dd className="text-lg font-semibold text-yellow-300">{player.rank}</dd>
              </div>
            </dl>
          </section>

          <section className="p-6 rounded-3xl bg-black/30 border border-white/5 backdrop-blur-md space-y-3">
            <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
              <Star size={18} className="text-blue-300" />
              주요 기록
            </h2>
            <ul className="space-y-2 text-sm text-white/70">
              <li>탑 진행도: {player.towerProgress}층</li>
              <li>랭크 포인트: {player.rp}</li>
              <li>최근 전적: {player.wins}승 {player.losses}패</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}