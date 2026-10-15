import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, notifyMaturityReminder, channelsAvailableForUser } = vi.hoisted(() => ({
  prisma: { investmentEntry: { findMany: vi.fn() }, reminderLog: { create: vi.fn() } },
  notifyMaturityReminder: vi.fn(),
  channelsAvailableForUser: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/cron/auth", () => ({ isAuthorizedCronRequest: () => true }));
vi.mock("@/lib/notify", () => ({ notifyMaturityReminder, channelsAvailableForUser }));
vi.mock("@/lib/reinvest/log", () => ({
  getReinvestContextForUser: vi.fn().mockResolvedValue({ taxResult: null }),
  logReinvestSuggestion: vi.fn().mockResolvedValue({}),
}));

import { GET } from "./route";

const DAY = 24 * 60 * 60 * 1000;
const investment = (daysLeft: number, reminderLogs: { windowDays: number; channel: string }[] = []) => ({
  id: "inv1",
  userId: "u1",
  label: "FDR",
  principalAmount: 100000,
  termMonths: 12,
  maturityDate: new Date(Date.now() + daysLeft * DAY - 60_000),
  user: { id: "u1" },
  reminderLogs,
});
const run = () => GET(new Request("http://localhost/api/cron/maturity-reminders"));

beforeEach(() => {
  vi.clearAllMocks();
  channelsAvailableForUser.mockReturnValue(["EMAIL", "PHONE"]);
  prisma.reminderLog.create.mockResolvedValue({});
  notifyMaturityReminder.mockImplementation(async (_u, _i, opts) =>
    opts.channels.map((channel: string) => ({ channel, sent: true }))
  );
});

describe("maturity reminders are sent once", () => {
  it("a new entry one day from maturity gets one reminder, not the 7-day and 1-day ones together", async () => {
    prisma.investmentEntry.findMany.mockResolvedValue([investment(1)]);
    await run();

    expect(notifyMaturityReminder).toHaveBeenCalledTimes(1);
    expect(prisma.reminderLog.create.mock.calls.map(([a]) => a.data.windowDays)).toEqual([1, 1]);
  });

  it("sends only on the channels not yet logged for that window", async () => {
    prisma.investmentEntry.findMany.mockResolvedValue([investment(5, [{ windowDays: 7, channel: "EMAIL" }])]);
    const body = await (await run()).json();

    expect(notifyMaturityReminder).toHaveBeenCalledTimes(1);
    expect(notifyMaturityReminder.mock.calls[0][2].channels).toEqual(["PHONE"]);
    expect(body.sent).toBe(1);
  });

  it("claims the log row before sending, so an overlapping run that loses the claim sends nothing", async () => {
    prisma.investmentEntry.findMany.mockResolvedValue([investment(5)]);
    prisma.reminderLog.create.mockRejectedValue(new Error("Unique constraint failed")); // other run won
    await run();

    expect(notifyMaturityReminder).not.toHaveBeenCalled();
  });
});
