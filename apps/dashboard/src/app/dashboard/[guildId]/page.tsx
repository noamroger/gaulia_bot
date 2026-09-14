import { redirect } from "next/navigation";

export default async function GuildIndexPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}): Promise<never> {
  const { guildId } = await params;
  redirect(`/dashboard/${guildId}/settings`);
}
