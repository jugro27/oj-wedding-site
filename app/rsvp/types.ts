export type ExistingRSVP = {
  attending: boolean;
  dietary_restrictions: string | null;
  song_request: string | null;
  submitted_at: string | null;
};

export type Guest = {
  id: string;
  first_name: string;
  last_name: string;
  rsvp: ExistingRSVP | null;
};

export type Invitation = {
  household_id: string;
  household_name: string;
  guests: Guest[];
};

export type GuestResponse = {
  attending: boolean | null;
  dietary_restrictions: string;
  song_request: string;
};
