import type { Metadata } from "next";
import { getLeagueSnapshot } from "@/lib/espn";
import { AssistantClient } from "@/components/assistant-client";

export const metadata: Metadata = {
  title: "Fantasy Assistant",
  description:
    "Ask the Goofy Cup assistant about rosters, matchups, trades, waivers, and current NFL news.",
};

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const league = await getLeagueSnapshot();
  return <AssistantClient league={league} />;
}
