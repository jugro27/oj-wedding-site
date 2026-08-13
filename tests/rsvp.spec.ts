import { expect, test, type Page } from "@playwright/test";
import type { Invitation } from "../app/rsvp/types";

const invitation: Invitation = {
  household_id: "10000000-0000-0000-0000-000000000001",
  household_name: "The Smith Family",
  guests: [
    {
      id: "20000000-0000-0000-0000-000000000001",
      first_name: "Sarah",
      last_name: "Smith",
      rsvp: null,
    },
    {
      id: "20000000-0000-0000-0000-000000000002",
      first_name: "John",
      last_name: "Smith",
      rsvp: null,
    },
  ],
};

async function mockSupabase(page: Page, existing = invitation) {
  let savedInvitation = structuredClone(existing);
  let submittedPayload: unknown;

  await page.route("**/rest/v1/rpc/**", async (route) => {
    const name = new URL(route.request().url()).pathname.split("/").pop();
    const requestBody = route.request().postDataJSON();

    if (name === "find_invitation") {
      await route.fulfill({ json: requestBody.p_invite_code === "BAD" ? null : savedInvitation });
      return;
    }

    if (name === "submit_rsvp") {
      submittedPayload = requestBody.p_responses;
      savedInvitation = {
        ...savedInvitation,
        guests: savedInvitation.guests.map((guest, index) => ({
          ...guest,
          rsvp: {
            ...requestBody.p_responses[index],
            submitted_at: "2026-08-12T12:00:00Z",
          },
        })),
      };
      await route.fulfill({ json: { success: true } });
      return;
    }

    await route.abort();
  });

  return { getSubmittedPayload: () => submittedPayload };
}

test("looks up an invitation, validates every guest, and saves responses", async ({ page }) => {
  const api = await mockSupabase(page);
  await page.goto("/rsvp");

  await page.getByLabel("Invitation code").fill("TEST123");
  await page.getByRole("button", { name: "Find invitation" }).click();
  await expect(page.getByRole("heading", { name: "The Smith Family" })).toBeVisible();

  await page.getByRole("radio", { name: "Joyfully accepts" }).first().check();
  await page.getByLabel("Dietary restrictions").fill("Gluten free");
  await page.getByLabel("Interested in bus transportation").check();
  await page.getByLabel("Song request").fill("Dancing Queen");
  await page.getByRole("button", { name: "Submit RSVP" }).click();

  await expect(page.getByText(/Please choose attending or unable to attend for John/)).toBeVisible();
  await page.getByRole("radio", { name: "Regretfully declines" }).nth(1).check();
  await page.getByRole("button", { name: "Submit RSVP" }).click();

  await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
  expect(api.getSubmittedPayload()).toEqual([
    {
      guest_id: invitation.guests[0].id,
      attending: true,
      dietary_restrictions: "Gluten free",
      song_request: "Dancing Queen",
      bus_signup: true,
    },
    {
      guest_id: invitation.guests[1].id,
      attending: false,
      dietary_restrictions: "",
      song_request: "",
      bus_signup: false,
    },
  ]);
});

test("shows a useful message for an invalid code", async ({ page }) => {
  await mockSupabase(page);
  await page.goto("/rsvp");
  await page.getByLabel("Invitation code").fill("BAD");
  await page.getByRole("button", { name: "Find invitation" }).click();
  await expect(page.getByText(/couldn't find an invitation/)).toBeVisible();
});

test("prefills an existing RSVP and clears attending-only answers on decline", async ({ page }) => {
  const existing = structuredClone(invitation);
  existing.guests[0].rsvp = {
    attending: true,
    dietary_restrictions: "Nut allergy",
    song_request: "September",
    bus_signup: true,
    submitted_at: "2026-08-11T12:00:00Z",
  };
  existing.guests[1].rsvp = {
    attending: false,
    dietary_restrictions: null,
    song_request: null,
    bus_signup: false,
    submitted_at: "2026-08-11T12:00:00Z",
  };
  const api = await mockSupabase(page, existing);

  await page.goto("/rsvp");
  await page.getByLabel("Invitation code").fill("TEST123");
  await page.getByRole("button", { name: "Find invitation" }).click();
  await expect(page.getByLabel("Song request")).toHaveValue("September");

  await page.getByRole("radio", { name: "Regretfully declines" }).first().check();
  await expect(page.getByLabel("Song request")).toHaveCount(0);
  await page.getByRole("button", { name: "Update RSVP" }).click();
  await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();

  expect(api.getSubmittedPayload()).toEqual([
    {
      guest_id: invitation.guests[0].id,
      attending: false,
      dietary_restrictions: "",
      song_request: "",
      bus_signup: false,
    },
    {
      guest_id: invitation.guests[1].id,
      attending: false,
      dietary_restrictions: "",
      song_request: "",
      bus_signup: false,
    },
  ]);
});
