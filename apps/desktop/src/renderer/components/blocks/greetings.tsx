import dayjs from "dayjs";
import { useSettingsStore } from "~/renderer/stores/settings";

export const Greetings = () => {
  const username = useSettingsStore((state) => state.username || "User");

  return <div className="text-3xl font-extralight">{getGreeting(username)}</div>;
};

const getGreeting = (username: string) => {
  const hour = dayjs().hour();

  if (hour < 12) return `Good morning, ${username}`;
  if (hour < 17) return `Good afternoon, ${username}`;
  return `Good evening, ${username}`;
};
