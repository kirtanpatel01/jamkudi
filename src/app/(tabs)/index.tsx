import React from "react";
import { Screen } from "@/components/common/Screen";
import { HomeHeader } from "@/components/home/HomeHeader";
import { FilterChips } from "@/components/home/FilterChips";
import { QuickAccessGrid } from "@/components/home/QuickAccessGrid";
import { MusicSection } from "@/components/home/MusicSection";
import {
  MADE_FOR_YOU_DATA,
  RECENTLY_PLAYED_DATA,
  TOP_MIXES_DATA,
} from "@/data/mockMusic";

export default function HomeScreen() {
  return (
    <Screen scrollable>
      {/* Top Header */}
      <HomeHeader />

      {/* Filter Chips */}
      <FilterChips />

      {/* Quick Access Grid */}
      <QuickAccessGrid />

      {/* Made for You */}
      <MusicSection title="Made for You" data={MADE_FOR_YOU_DATA} />

      {/* Recently Played */}
      <MusicSection title="Recently Played" data={RECENTLY_PLAYED_DATA} />

      {/* Your Top Mixes */}
      <MusicSection title="Your Top Mixes" data={TOP_MIXES_DATA} />
    </Screen>
  );
}
