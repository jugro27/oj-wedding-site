"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { GuestResponse, Invitation } from "./types";

const MAX_TEXT_LENGTH = 500;

function responsesFor(invitation: Invitation) {
  return Object.fromEntries(
    invitation.guests.map((guest) => [
      guest.id,
      {
        attending: guest.rsvp?.attending ?? null,
        dietary_restrictions: guest.rsvp?.dietary_restrictions ?? "",
        song_request: guest.rsvp?.song_request ?? "",
        bus_signup: guest.rsvp?.bus_signup ?? false,
      },
    ]),
  ) as Record<string, GuestResponse>;
}

export function RSVPForm() {
  const [inviteCode, setInviteCode] = useState("");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [responses, setResponses] = useState<Record<string, GuestResponse>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  function focusStatus() {
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  async function loadInvitation(code: string) {
    const supabase = createClient();
    const { data, error: lookupError } = await supabase.rpc("find_invitation", {
      p_invite_code: code,
    });

    if (lookupError) throw lookupError;
    return data as Invitation | null;
  }

  async function findInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("inviteCode") ?? "").trim();

    setError("");
    setInvitation(null);
    setSubmitted(false);

    if (!code) {
      setError("Please enter your invitation code.");
      focusStatus();
      return;
    }

    setLoading(true);
    try {
      const foundInvitation = await loadInvitation(code);

      if (!foundInvitation || foundInvitation.guests.length === 0) {
        setError("We couldn't find an invitation with that code. Please check it and try again.");
        focusStatus();
        return;
      }

      setInviteCode(code);
      setInvitation(foundInvitation);
      setResponses(responsesFor(foundInvitation));
      focusStatus();
    } catch (lookupError) {
      console.error(lookupError);
      setError("We couldn't look up your invitation right now. Please try again in a moment.");
      focusStatus();
    } finally {
      setLoading(false);
    }
  }

  function updateResponse<K extends keyof GuestResponse>(
    guestId: string,
    field: K,
    value: GuestResponse[K],
  ) {
    setResponses((current) => ({
      ...current,
      [guestId]: { ...current[guestId], [field]: value },
    }));
  }

  function setAttendance(guestId: string, attending: boolean) {
    setResponses((current) => ({
      ...current,
      [guestId]: {
        ...current[guestId],
        attending,
        ...(attending
          ? {}
          : { dietary_restrictions: "", song_request: "", bus_signup: false }),
      },
    }));
    setError("");
  }

  async function submitRSVP(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invitation || submitting) return;

    setError("");
    setSubmitted(false);

    const unanswered = invitation.guests.filter(
      (guest) => responses[guest.id]?.attending === null,
    );
    if (unanswered.length > 0) {
      setError(
        `Please choose attending or unable to attend for ${unanswered.map((guest) => guest.first_name).join(", ")}.`,
      );
      focusStatus();
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const payload = invitation.guests.map((guest) => {
        const response = responses[guest.id];
        return {
          guest_id: guest.id,
          attending: response.attending,
          dietary_restrictions: response.attending
            ? response.dietary_restrictions.trim()
            : "",
          song_request: response.attending ? response.song_request.trim() : "",
          bus_signup: response.attending ? response.bus_signup : false,
        };
      });

      const { error: submitError } = await supabase.rpc("submit_rsvp", {
        p_invite_code: inviteCode,
        p_responses: payload,
      });
      if (submitError) throw submitError;

      const savedInvitation = await loadInvitation(inviteCode);
      if (!savedInvitation) throw new Error("Saved invitation could not be reloaded");

      setInvitation(savedInvitation);
      setResponses(responsesFor(savedInvitation));
      setSubmitted(true);
      focusStatus();
    } catch (submitError) {
      console.error(submitError);
      setError("We couldn't save your RSVP. Your answers are still here—please try again.");
      focusStatus();
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setInvitation(null);
    setResponses({});
    setSubmitted(false);
    setError("");
    setInviteCode("");
  }

  return (
    <section className="rsvp-shell" aria-label="RSVP form">
      <div
        className="rsvp-status"
        ref={statusRef}
        tabIndex={-1}
        aria-live="polite"
      >
        {error && <p className="form-alert form-alert-error">{error}</p>}
        {!error && invitation && !submitted && (
          <p className="sr-only">Invitation found for {invitation.household_name}.</p>
        )}
        {submitted && (
          <div className="success-card">
            <span className="success-mark" aria-hidden="true">✓</span>
            <p className="eyebrow">Response received</p>
            <h2>Thank you!</h2>
            <p>Your RSVP for {invitation?.household_name} has been saved.</p>
            <p className="success-note">
              You can return with your invitation code if your plans change.
            </p>
            <div className="success-actions">
              <button className="button button-primary" type="button" onClick={() => setSubmitted(false)}>
                Review response
              </button>
              <Link className="text-link" href="/">Return home</Link>
            </div>
          </div>
        )}
      </div>

      {!invitation && !submitted && (
        <form className="lookup-card" onSubmit={findInvitation} noValidate>
          <div className="lookup-number" aria-hidden="true">01</div>
          <div>
            <label htmlFor="invite-code">Invitation code</label>
            <p className="field-help" id="invite-code-help">
              Codes are not case-sensitive.
            </p>
            <div className="lookup-row">
              <input
                key={inviteCode}
                id="invite-code"
                name="inviteCode"
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                aria-describedby="invite-code-help"
                defaultValue={inviteCode}
                disabled={loading}
                required
              />
              <button className="button button-primary" type="submit" disabled={loading}>
                {loading ? "Searching…" : "Find invitation"}
              </button>
            </div>
          </div>
        </form>
      )}

      {invitation && !submitted && (
        <form className="response-form" onSubmit={submitRSVP} noValidate>
          <div className="response-heading">
            <div>
              <p className="eyebrow">Invitation found</p>
              <h2>{invitation.household_name}</h2>
              <p>
                {invitation.guests.some((guest) => guest.rsvp)
                  ? "Review or update each response below."
                  : "Please respond for each guest named on this invitation."}
              </p>
            </div>
            <button className="quiet-button" type="button" onClick={startOver}>
              Use another code
            </button>
          </div>

          <div className="guest-list">
            {invitation.guests.map((guest, index) => {
              const response = responses[guest.id];
              if (!response) return null;

              return (
                <fieldset className="guest-card" key={guest.id}>
                  <legend>
                    <span>Guest {String(index + 1).padStart(2, "0")}</span>
                    {guest.first_name} {guest.last_name}
                  </legend>

                  <div className="form-group">
                    <p className="field-label">Will you be attending?</p>
                    <div className="attendance-options">
                      <label className={response.attending === true ? "selected" : ""}>
                        <input
                          type="radio"
                          name={`attending-${guest.id}`}
                          checked={response.attending === true}
                          onChange={() => setAttendance(guest.id, true)}
                        />
                        <span>Joyfully accepts</span>
                      </label>
                      <label className={response.attending === false ? "selected" : ""}>
                        <input
                          type="radio"
                          name={`attending-${guest.id}`}
                          checked={response.attending === false}
                          onChange={() => setAttendance(guest.id, false)}
                        />
                        <span>Regretfully declines</span>
                      </label>
                    </div>
                  </div>

                  {response.attending === true && (
                    <div className="attending-fields">
                      <div className="form-group">
                        <label htmlFor={`dietary-${guest.id}`}>Dietary restrictions</label>
                        <p className="field-help" id={`dietary-help-${guest.id}`}>
                          Tell us about any allergies or dietary needs. Leave blank if none.
                        </p>
                        <textarea
                          id={`dietary-${guest.id}`}
                          aria-describedby={`dietary-help-${guest.id}`}
                          maxLength={MAX_TEXT_LENGTH}
                          rows={3}
                          value={response.dietary_restrictions}
                          onChange={(event) => updateResponse(guest.id, "dietary_restrictions", event.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="check-option">
                          <input
                            type="checkbox"
                            checked={response.bus_signup}
                            onChange={(event) => updateResponse(guest.id, "bus_signup", event.target.checked)}
                          />
                          <span>
                            <strong>Interested in bus transportation</strong>
                            <small>Transportation details are coming soon.</small>
                          </span>
                        </label>
                      </div>

                      <div className="form-group">
                        <label htmlFor={`song-${guest.id}`}>Song request</label>
                        <p className="field-help" id={`song-help-${guest.id}`}>
                          What song will get you onto the dance floor?
                        </p>
                        <input
                          id={`song-${guest.id}`}
                          type="text"
                          aria-describedby={`song-help-${guest.id}`}
                          maxLength={MAX_TEXT_LENGTH}
                          value={response.song_request}
                          onChange={(event) => updateResponse(guest.id, "song_request", event.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </fieldset>
              );
            })}
          </div>

          <div className="form-submit-row">
            <p>Responses can be updated later using the same invitation code.</p>
            <button className="button button-primary" type="submit" disabled={submitting}>
              {submitting
                ? "Saving…"
                : invitation.guests.some((guest) => guest.rsvp)
                  ? "Update RSVP"
                  : "Submit RSVP"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
