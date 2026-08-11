"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ExistingRSVP = {
  attending: boolean;
  meal_choice: string | null;
  dietary_restrictions: string | null;
  song_request: string | null;
  bus_signup: boolean;
  submitted_at: string | null;
};

type Guest = {
  id: string;
  first_name: string;
  last_name: string;
  plus_one: boolean;
  rsvp: ExistingRSVP | null;
};

type Invitation = {
  household_id: string;
  household_name: string;
  guests: Guest[];
};

type GuestResponse = {
  attending: boolean | null;
  meal_choice: string;
  dietary_restrictions: string;
  song_request: string;
  bus_signup: boolean;
};

export default function RSVPPage() {
  const [inviteCode, setInviteCode] = useState("");
  const [invitation, setInvitation] = useState<Invitation | null>(null);

  const [responses, setResponses] = useState<
    Record<string, GuestResponse>
  >({});

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function findInvitation() {
    setError("");
    setInvitation(null);
    setSubmitted(false);

    if (!inviteCode.trim()) {
      setError("Please enter your invitation code.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.rpc("find_invitation", {
      p_invite_code: inviteCode.trim(),
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setError("Something went wrong while looking up your invitation.");
      return;
    }

    if (!data) {
      setError("We couldn't find an invitation with that code.");
      return;
    }

    const foundInvitation = data as Invitation;

    setInvitation(foundInvitation);

    // Create a blank RSVP form for every guest.
    const initialResponses: Record<string, GuestResponse> = {};

    foundInvitation.guests.forEach((guest) => {
      if (guest.rsvp) {
        initialResponses[guest.id] = {
          attending: guest.rsvp.attending,
          meal_choice: guest.rsvp.meal_choice ?? "",
          dietary_restrictions:
            guest.rsvp.dietary_restrictions ?? "",
          song_request: guest.rsvp.song_request ?? "",
          bus_signup: guest.rsvp.bus_signup ?? false,
        };
      } else {
        initialResponses[guest.id] = {
          attending: null,
          meal_choice: "",
          dietary_restrictions: "",
          song_request: "",
          bus_signup: false,
        };
      }
    });

    setResponses(initialResponses);
  }

  function updateResponse(
    guestId: string,
    field: keyof GuestResponse,
    value: string | boolean | null
  ) {
    setResponses((currentResponses) => ({
      ...currentResponses,

      [guestId]: {
        ...currentResponses[guestId],
        [field]: value,
      },
    }));
  }

  async function submitRSVP() {
    if (!invitation) {
      return;
    }

    setError("");
    setSubmitted(false);

    // Make sure every guest has answered Yes or No.
    const unansweredGuests = invitation.guests.filter(
      (guest) => responses[guest.id]?.attending === null
    );

    if (unansweredGuests.length > 0) {
      setError(
        "Please select attending or not attending for every guest."
      );
      return;
    }

    setSubmitting(true);

    const supabase = createClient();

    const responsePayload = invitation.guests.map((guest) => {
      const response = responses[guest.id];

      return {
        guest_id: guest.id,
        attending: response.attending,
        meal_choice: response.meal_choice,
        dietary_restrictions: response.dietary_restrictions,
        song_request: response.song_request,
        bus_signup: response.bus_signup,
      };
    });

    const { error } = await supabase.rpc("submit_rsvp", {
      p_invite_code: inviteCode.trim(),
      p_responses: responsePayload,
    });

    setSubmitting(false);

    if (error) {
      console.error(error);
      setError("Something went wrong while submitting your RSVP.");
      return;
    }

    setSubmitted(true);
  }

  return (
    <main>
      <h1>RSVP</h1>

      {!invitation && (
        <div>
          <p>Enter the invitation code from your invitation.</p>

          <input
            type="text"
            placeholder="Invitation code"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
          />

          <button
            onClick={findInvitation}
            disabled={loading}
          >
            {loading ? "Searching..." : "Find My Invitation"}
          </button>
        </div>
      )}

      {error && <p>{error}</p>}

      {invitation && !submitted && (
        <div>
          <h2>{invitation.household_name}</h2>

          {invitation.guests.some((guest) => guest.rsvp) ? (
            <p>
              We found an existing RSVP for this invitation.
              You can review or update your responses below.
            </p>
          ) : (
            <p>
              Please RSVP for each guest listed below.
            </p>
          )}

          {invitation.guests.map((guest) => {
            const response = responses[guest.id];

            if (!response) {
              return null;
            }

            return (
              <section key={guest.id}>
                <hr />

                <h3>
                  {guest.first_name} {guest.last_name}
                </h3>

                <p>Will you be attending?</p>

                <label>
                  <input
                    type="radio"
                    name={`attending-${guest.id}`}
                    checked={response.attending === true}
                    onChange={() =>
                      updateResponse(
                        guest.id,
                        "attending",
                        true
                      )
                    }
                  />
                  Yes
                </label>

                <label>
                  <input
                    type="radio"
                    name={`attending-${guest.id}`}
                    checked={response.attending === false}
                    onChange={() =>
                      updateResponse(
                        guest.id,
                        "attending",
                        false
                      )
                    }
                  />
                  No
                </label>

                {response.attending === true && (
                  <div>
                    <p>Meal choice</p>

                    <select
                      value={response.meal_choice}
                      onChange={(event) =>
                        updateResponse(
                          guest.id,
                          "meal_choice",
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Select a meal
                      </option>

                      <option value="Chicken">
                        Chicken
                      </option>

                      <option value="Beef">
                        Beef
                      </option>

                      <option value="Vegetarian">
                        Vegetarian
                      </option>
                    </select>

                    <p>Dietary restrictions</p>

                    <input
                      type="text"
                      placeholder="Allergies or dietary restrictions"
                      value={response.dietary_restrictions}
                      onChange={(event) =>
                        updateResponse(
                          guest.id,
                          "dietary_restrictions",
                          event.target.value
                        )
                      }
                    />

                    <p>
                      <label>
                        <input
                          type="checkbox"
                          checked={response.bus_signup}
                          onChange={(event) =>
                            updateResponse(
                              guest.id,
                              "bus_signup",
                              event.target.checked
                            )
                          }
                        />
                        Sign me up for bus transportation
                      </label>
                    </p>
                  </div>
                )}

                <p>Song request</p>

                <input
                  type="text"
                  placeholder="What song will get you on the dance floor?"
                  value={response.song_request}
                  onChange={(event) =>
                    updateResponse(
                      guest.id,
                      "song_request",
                      event.target.value
                    )
                  }
                />
              </section>
            );
          })}

          <hr />

          <button
            onClick={submitRSVP}
            disabled={submitting}
          >
            {submitting
              ? "Saving..."
              : invitation.guests.some((guest) => guest.rsvp)
                ? "Update RSVP"
                : "Submit RSVP"}
          </button>
        </div>
      )}

      {submitted && invitation && (
        <div>
          <h2>Thank you!</h2>

          <p>
            Your RSVP for {invitation.household_name} has been saved.
          </p>

          <p>
            You can return to this page with your invitation code
            if you need to make changes later.
          </p>
        </div>
      )}
    </main>
  );
}