export type ExistingRSVP = {
  attending: boolean;
  dietary_restrictions: string | null;
  song_request: string | null;
  bus_signup: boolean;
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
  bus_signup: boolean;
};
